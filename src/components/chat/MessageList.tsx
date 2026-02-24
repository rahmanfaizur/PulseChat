"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef } from "react";
import { formatTimestamp } from "@/lib/utils";

interface MessageListProps {
    conversationId: Id<"conversations">;
}

export default function MessageList({ conversationId }: MessageListProps) {
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const typingMembers = useQuery(api.members.getTypingMembers, { conversationId });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, typingMembers]);

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
        <ScrollArea className="flex-1 p-4">
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

                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMine
                                    ? "bg-indigo-600 text-white rounded-br-sm"
                                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-white/5"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                <div className={`flex items-center justify-end space-x-1 mt-1 ${isMine ? "text-indigo-200" : "text-zinc-500"}`}>
                                    <span className="text-[10px]">{formatTimestamp(msg._creationTime)}</span>
                                </div>
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

                <div ref={scrollRef} className="h-1" />
            </div>
        </ScrollArea>
    );
}
