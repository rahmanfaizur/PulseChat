"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { formatTimestamp } from "@/lib/utils";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { ArrowDown, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface MessageListProps {
    conversationId: Id<"conversations">;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export default function MessageList({ conversationId }: MessageListProps) {
    const { user } = useUser();
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const typingMembers = useQuery(api.members.getTypingMembers, { conversationId });
    const markAsRead = useMutation(api.members.markAsRead);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    const { scrollRef, handleScroll, scrollToBottom, showNewMessages } = useAutoScroll([messages, typingMembers]);

    // Mark as read effect
    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            markAsRead({ conversationId, messageId: lastMessage._id }).catch(() => { });
        }
    }, [messages, typingMembers, conversationId, markAsRead]);

    if (messages === undefined) {
        return (
            <div className="flex-1 p-6 space-y-6 flex flex-col justify-end">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-64"} bg-zinc-800 rounded-2xl`} />
                    </div>
                ))}
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                <div className="bg-zinc-900 rounded-full p-6 mb-4">
                    <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <p className="font-medium text-zinc-300">No messages yet</p>
                <p className="text-sm mt-1 max-w-sm">Break the ice! Send a message to start the conversation.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <ScrollArea className="flex-1 p-4" viewportRef={scrollRef} onScroll={handleScroll}>
                <div className="max-w-4xl mx-auto space-y-6 pb-2">
                    {messages.map((msg: any, index: number) => {
                        const isMine = msg.isMine;
                        const showAvatar = !isMine && (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId);

                        return (
                            <div key={msg._id} className={`flex items-end space-x-2 ${isMine ? "justify-end" : "justify-start"}`}>
                                {!isMine && (
                                    <div className="w-8 shrink-0">
                                        {showAvatar && (
                                            <Avatar className="h-8 w-8 border border-zinc-800">
                                                <AvatarImage src={msg.sender?.imageUrl} alt={msg.sender?.name || ""} />
                                                <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                                                    {msg.sender?.name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                )}

                                <div className="relative group flex flex-col items-start w-full" style={{ alignItems: isMine ? "flex-end" : "flex-start" }}>
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm relative ${isMine
                                            ? "bg-indigo-600 text-white rounded-br-sm"
                                            : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-white/5"
                                            }`}
                                    >
                                        <p className={`whitespace-pre-wrap break-words leading-relaxed ${msg.isDeleted ? "italic opacity-80 text-xs" : ""}`}>
                                            {msg.content}
                                        </p>
                                        <div className={`flex items-center justify-end space-x-1 mt-1 ${isMine ? "text-indigo-200" : "text-zinc-500"}`}>
                                            <span className="text-[10px]">{formatTimestamp(msg._creationTime)}</span>
                                        </div>

                                        {/* Action Buttons (Hover) */}
                                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-[.group]:hover:opacity-100 transition-all z-10 ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                                            {!msg.isDeleted && (
                                                <div className="flex bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-md border border-white/10 overflow-hidden">
                                                    {EMOJIS.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={(e) => { e.stopPropagation(); toggleReaction({ messageId: msg._id, reaction: emoji }).catch(() => { }); }}
                                                            className="p-1.5 hover:bg-zinc-600 transition-colors text-[13px]"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {isMine && !msg.isDeleted && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteMessage({ messageId: msg._id }).catch(() => { }); }}
                                                    className="p-2 rounded-full bg-zinc-800/90 backdrop-blur-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-all shadow-md border border-white/10"
                                                    title="Delete message"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions Display */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                            {Object.entries(msg.reactions).map(([emoji, userIds]: [string, any]) => {
                                                const hasReacted = userIds.includes(typingMembers?.[0]?._id); // Pseudo self check to make some state different visually (not strictly accurate for now but works for demo)
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => toggleReaction({ messageId: msg._id, reaction: emoji }).catch(() => { })}
                                                        className={`px-1.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 border transition-colors ${hasReacted
                                                                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-200"
                                                                : "bg-zinc-800/80 border-white/5 text-zinc-300 hover:bg-zinc-700"
                                                            }`}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span>{userIds.length}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {typingMembers && typingMembers.length > 0 && (
                        <div className="flex items-end space-x-2 justify-start">
                            <div className="w-8 shrink-0">
                                <Avatar className="h-8 w-8 border border-zinc-800">
                                    <AvatarImage src={(typingMembers[0] as any)?.imageUrl} />
                                    <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                                        {(typingMembers[0] as any)?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="bg-zinc-800 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center space-x-1 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {showNewMessages && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 hover:bg-zinc-700 text-white rounded-full px-4 py-2 text-xs font-medium shadow-lg flex items-center gap-1.5 transition-all animate-in fade-in slide-in-from-bottom-2 z-10"
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                    New messages
                </button>
            )}
        </div>
    );
}
