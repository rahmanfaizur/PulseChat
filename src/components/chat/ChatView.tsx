"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

// Reply context passed between MessageList → ChatView → MessageInput
export interface ReplyContext {
    messageId: Id<"messages">;
    senderName: string;
    content: string;
}

export default function ChatView({ conversationId }: { conversationId: Id<"conversations"> }) {
    const conversations = useQuery(api.conversations.getMyConversations);
    const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);

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
    const imageUrl = (conversation as any).isGroup ? "" : otherMember?.imageUrl;
    const isOnline = (conversation as any).isGroup ? false : otherMember?.isOnline;

    return (
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-[#150a26] via-[#09050d] to-[#040206]">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <ChatHeader name={title} imageUrl={imageUrl} isOnline={isOnline} />
                <MessageList
                    conversationId={conversationId}
                    onReply={setReplyTo}
                />
                <MessageInput
                    conversationId={conversationId}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                />
            </div>

            {/* Right Side Members List */}
            <div className="w-64 border-l border-white/5 bg-black/20 flex flex-col overflow-hidden shrink-0 hidden lg:flex">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Members
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Always show current user */}
                    <div className="flex items-center gap-3 group">
                        <div className="relative">
                            <Avatar className="h-8 w-8 border border-white/10">
                                {/* Assuming current user is always listed in members or just show a generic 'You' if not found easily */}
                                {/* In this snippet, I am focusing on the "otherMember" as the main participant plus "You" */}
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-xs text-white">
                                    Y
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#09050d] rounded-full"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">You</span>
                            <span className="text-[10px] text-zinc-500">Online</span>
                        </div>
                    </div>

                    {/* Other Members */}
                    {(conversation as any).otherMembers?.map((member: any) => (
                        <div key={member._id} className="flex items-center gap-3 group">
                            <div className="relative">
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
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate max-w-[120px]">
                                    {member.name}
                                </span>
                                <span className="text-[10px] text-zinc-500">{member.isOnline ? "Online" : "Offline"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
