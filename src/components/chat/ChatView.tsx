"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

// Reply context passed between MessageList → ChatView → MessageInput
export interface ReplyContext {
    messageId: Id<"messages">;
    senderName: string;
    content: string;
}

export default function ChatView({ conversationId }: { conversationId: Id<"conversations"> }) {
    const conversations = useQuery(api.conversations.getMyConversations);
    const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
    const markAsRead = useMutation(api.members.markAsRead);
    const router = useRouter();
    const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);
    const [activeMember, setActiveMember] = useState<any | null>(null);
    const [initialUnreadCount, setInitialUnreadCount] = useState<number>(0);

    // Reset initial unread count when switching conversations
    useEffect(() => {
        setInitialUnreadCount(0);
    }, [conversationId]);

    // Eagerly mark as read when conversation is opened or a new message arrives
    // Uses lastMessage already available from sidebar query — no need to wait for MessageList
    useEffect(() => {
        const conversation = conversations?.find((c: any) => c._id === conversationId);

        // Capture initial unread count before it gets cleared
        if (conversation && initialUnreadCount === 0 && conversation.unreadCount > 0) {
            setInitialUnreadCount(conversation.unreadCount);
        }

        const lastMsgId = conversation?.lastMessage?._id;
        if (lastMsgId) {
            markAsRead({ conversationId, messageId: lastMsgId }).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, conversations?.find?.((c: any) => c._id === conversationId)?.lastMessage?._id]);

    if (conversations === undefined) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950/80">
                <Skeleton className="w-16 h-16 rounded-full bg-zinc-800 mb-4" />
                <Skeleton className="h-6 w-1/3 bg-zinc-800 mb-2" />
                <Skeleton className="h-4 w-1/4 bg-zinc-800" />
            </div>
        );
    }

    const conversation = conversations.find((c: any) => c._id === conversationId);

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                Conversation not found or access denied.
            </div>
        );
    }

    const otherMember = (conversation as any).otherMembers[0];
    const title = (conversation as any).isGroup ? (conversation as any).name : otherMember?.name || "Unknown User";
    const imageUrl = (conversation as any).isGroup ? ((conversation as any).imageUrl || "") : otherMember?.imageUrl;
    const isOnline = (conversation as any).isGroup ? false : otherMember?.isOnline;

    const handleMessageMember = async (member: any) => {
        try {
            const newConversationId = await getOrCreateConversation({ otherUserId: member._id });
            setActiveMember(null);
            router.push(`/${newConversationId}`);
        } catch {
            toast.error("Failed to open DM");
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-[#2d1065] via-[#1a0533] to-[#0d0120]">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                <ChatHeader name={title} imageUrl={imageUrl} isOnline={isOnline} />
                <MessageList
                    conversationId={conversationId}
                    onReply={setReplyTo}
                    initialUnreadCount={initialUnreadCount}
                />
                <MessageInput
                    conversationId={conversationId}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                />
            </div>

            {/* Right Side Members List */}
            <div className="w-64 border-l border-white/5 bg-gradient-to-b from-[#2d1065]/70 via-[#1a0533]/70 to-[#0d0120]/70 backdrop-blur-sm flex flex-col overflow-hidden shrink-0 hidden lg:flex">
                <div className="p-4 border-b border-purple-500/10 bg-white/[0.03]">
                    <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"></span>
                        Members
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {/* Current user — no click action */}
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg group">
                        <div className="relative shrink-0">
                            <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-xs text-white">
                                    Y
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#09050d] rounded-full"></span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-zinc-200 truncate">You</span>
                            <span className="text-[10px] text-purple-400/50">Online</span>
                        </div>
                    </div>

                    {/* Other Members — clickable */}
                    {(conversation as any).otherMembers?.map((member: any) => (
                        <div key={member._id} className="relative">
                            <button
                                onClick={() => setActiveMember(activeMember?._id === member._id ? null : member)}
                                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-left ${activeMember?._id === member._id ? "bg-violet-600/15" : "hover:bg-purple-500/10"}`}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarImage src={member.imageUrl} />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-xs text-white">
                                            {member.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#09050d] rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-zinc-200 truncate">{member.name}</span>
                                    <span className="text-[10px] text-purple-400/50">{member.isOnline ? "Online" : "Offline"}</span>
                                </div>
                            </button>

                            {/* Inline action card on click */}
                            {activeMember?._id === member._id && (
                                <div className="mx-2 mb-1 p-3 rounded-xl bg-[#2d1065]/80 border border-purple-500/20 backdrop-blur-md shadow-lg shadow-black/30 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-purple-200 truncate">{member.name}</span>
                                        <button onClick={() => setActiveMember(null)} className="text-purple-400/50 hover:text-purple-200 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleMessageMember(member)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white text-xs font-medium transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Message
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
