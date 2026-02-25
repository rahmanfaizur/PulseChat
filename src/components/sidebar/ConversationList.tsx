"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { format } from "date-fns";

export default function ConversationList({ searchQuery }: { searchQuery: string }) {
    const router = useRouter();
    const params = useParams();
    const activeConversationId = params.conversationId as string;

    const conversations = useQuery(api.conversations.getMyConversations);

    const filteredConversations = useMemo(() => {
        if (!conversations) return [];
        return conversations.filter((c: any) => {
            const otherMember = c.otherMembers[0];
            const title = c.isGroup ? c.name : otherMember?.name;
            return title?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery]);

    if (conversations === undefined) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full bg-zinc-800" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (filteredConversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full text-zinc-500">
                <div className="bg-purple-950/40 rounded-full p-4 mb-4">
                    <svg className="w-8 h-8 text-purple-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <p className="font-medium text-purple-200/70">No conversations</p>
                <p className="text-sm mt-1 text-purple-300/40">Search for a user to start chatting.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
                {filteredConversations.map((c: any) => {
                    const otherMember = c.otherMembers[0];
                    const title = c.isGroup ? c.name : otherMember?.name || "Unknown User";
                    const imageUrl = c.isGroup ? "" : otherMember?.imageUrl;
                    const isOnline = c.isGroup ? false : otherMember?.isOnline;
                    const isActive = activeConversationId === c._id;

                    let lastMessagePreview = "Started a conversation";
                    if (c.lastMessage) {
                        lastMessagePreview = c.lastMessage.content;
                    }

                    const timeString = c.lastMessage
                        ? format(new Date(c.lastMessage._creationTime), "h:mm a")
                        : "";

                    return (
                        <button
                            key={c._id}
                            onClick={() => router.push(`/${c._id}`)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${isActive
                                ? "bg-violet-600/15 hover:bg-violet-600/20"
                                : "hover:bg-purple-500/10"
                                }`}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12 border border-zinc-800">
                                    <AvatarImage src={c.isGroup ? (c.imageUrl || "") : imageUrl} alt={title} />
                                    <AvatarFallback className={`text-zinc-200 font-semibold text-sm ${c.isGroup ? "bg-gradient-to-br from-violet-600 to-fuchsia-700" : "bg-gradient-to-br from-indigo-600 to-violet-700"}`}>
                                        {title?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Unread badge — Discord-style red dot on avatar corner */}
                                {c.unreadCount > 0 && !isActive && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-[#1a0533] z-10">
                                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                                    </span>
                                )}
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#1a0533]"></span>
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <p className={`text-sm font-medium truncate ${isActive ? "text-violet-300" : "text-zinc-100"}`}>
                                            {title}
                                        </p>
                                        {c.isGroup && (
                                            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md self-center mt-0.5 whitespace-nowrap">
                                                {c.otherMembers.length + 1} members
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                                        <span className="text-[10px] text-zinc-500">{timeString}</span>
                                    </div>
                                </div>
                                <p className={`text-xs truncate block ${c.unreadCount > 0 && !isActive ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>
                                    {lastMessagePreview}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
