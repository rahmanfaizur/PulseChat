"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useCallback, useState } from "react";
import { formatTimestamp } from "@/lib/utils";
import { ArrowDown, MoreHorizontal, Trash2 } from "lucide-react";

interface MessageListProps {
    conversationId: Id<"conversations">;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export default function MessageList({ conversationId }: MessageListProps) {
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const typingMembers = useQuery(api.members.getTypingMembers, { conversationId });
    const markAsRead = useMutation(api.members.markAsRead);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    const scrollRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const prevInnerHeight = useRef<number | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Per-message hover and dropdown state
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = () => setOpenMenuId(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    // Scroll logic (article pattern with prevInnerHeight ref)
    useEffect(() => {
        const outer = scrollRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;

        const outerH = outer.clientHeight;
        const innerH = inner.clientHeight;
        const scrollTop = outer.scrollTop;

        const wasAtBottom =
            !prevInnerHeight.current ||
            scrollTop >= prevInnerHeight.current - outerH - 60;

        if (wasAtBottom) {
            outer.scrollTo({
                top: innerH - outerH,
                left: 0,
                behavior: prevInnerHeight.current ? "smooth" : "auto",
            });
            setShowScrollButton(false);
        } else {
            setShowScrollButton(true);
        }

        prevInnerHeight.current = innerH;
    }, [messages, typingMembers]);

    useEffect(() => {
        prevInnerHeight.current = null;
        setShowScrollButton(false);
        setHoveredId(null);
        setOpenMenuId(null);
    }, [conversationId]);

    const scrollToBottom = useCallback(() => {
        const outer = scrollRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;
        outer.scrollTo({ top: inner.clientHeight - outer.clientHeight, left: 0, behavior: "smooth" });
        setShowScrollButton(false);
    }, []);

    useEffect(() => {
        if (messages && messages.length > 0) {
            const last = messages[messages.length - 1];
            markAsRead({ conversationId, messageId: last._id }).catch(() => { });
        }
    }, [messages, conversationId, markAsRead]);

    if (messages === undefined) {
        return (
            <div className="flex-1 min-h-0 p-6 flex flex-col justify-end gap-4 overflow-hidden">
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
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
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
        <div className="flex-1 min-h-0 relative">
            <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
                <div ref={innerRef} className="px-4 py-4">
                    <div className="max-w-4xl mx-auto w-full flex flex-col gap-1">
                        {messages.map((msg: any, index: number) => {
                            const isMine = msg.isMine;
                            const isHovered = hoveredId === msg._id;
                            const menuOpen = openMenuId === msg._id;
                            const showAvatar =
                                !isMine &&
                                (index === messages.length - 1 ||
                                    messages[index + 1]?.senderId !== msg.senderId);

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex items-end gap-2 py-0.5 ${isMine ? "justify-end" : "justify-start"}`}
                                    onMouseEnter={() => setHoveredId(msg._id)}
                                    onMouseLeave={() => {
                                        if (!menuOpen) setHoveredId(null);
                                    }}
                                >
                                    {/* Other user avatar */}
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

                                    {/* Row: action toolbar + bubble (reversed for mine) */}
                                    <div className={`flex items-center gap-1.5 max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>

                                        {/* Message bubble */}
                                        <div className="flex flex-col">
                                            <div
                                                className={`rounded-2xl px-4 py-2 text-sm shadow-sm transition-colors ${isMine
                                                    ? "bg-indigo-600 text-white rounded-br-sm"
                                                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-white/5"
                                                    }`}
                                            >
                                                <p className={`whitespace-pre-wrap break-words leading-relaxed ${msg.isDeleted ? "italic opacity-80 text-xs" : ""}`}>
                                                    {msg.content}
                                                </p>
                                                <div className={`flex items-center justify-end mt-1 ${isMine ? "text-indigo-200" : "text-zinc-500"}`}>
                                                    <span className="text-[10px]">{formatTimestamp(msg._creationTime)}</span>
                                                </div>
                                            </div>

                                            {/* Reactions */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                                    {msg.reactions.map(({ emoji, userIds }: { emoji: string; userIds: any[] }) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction({ messageId: msg._id, reaction: emoji }).catch(() => { })}
                                                            className="px-1.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 border bg-zinc-800/80 border-white/5 text-zinc-300 hover:bg-zinc-700 transition-colors"
                                                        >
                                                            <span>{emoji}</span>
                                                            <span>{userIds.length}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover toolbar — only shown for THIS hovered message */}
                                        {(isHovered || menuOpen) && !msg.isDeleted && (
                                            <div className="flex items-center shrink-0">
                                                {/* Emoji + three-dot pill */}
                                                <div className="flex items-center bg-zinc-800/95 backdrop-blur-sm rounded-full shadow-lg border border-white/10 overflow-hidden">
                                                    {EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleReaction({ messageId: msg._id, reaction: emoji }).catch(() => { });
                                                            }}
                                                            className="px-2 py-1.5 hover:bg-zinc-600 transition-colors text-[14px]"
                                                            title={emoji}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}

                                                    {/* Divider */}
                                                    <span className="w-px h-4 bg-white/10 mx-0.5" />

                                                    {/* Three-dot menu button */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(menuOpen ? null : msg._id);
                                                            }}
                                                            className="px-2 py-1.5 hover:bg-zinc-600 transition-colors text-zinc-400 hover:text-zinc-100 rounded-r-full"
                                                            title="More options"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>

                                                        {/* Dropdown popup */}
                                                        {menuOpen && (
                                                            <div
                                                                className={`absolute z-50 mt-1 w-36 bg-zinc-800 border border-white/10 rounded-xl shadow-xl overflow-hidden ${isMine ? "right-0" : "left-0"} bottom-full mb-1`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {isMine && (
                                                                    <button
                                                                        onClick={() => {
                                                                            deleteMessage({ messageId: msg._id }).catch(() => { });
                                                                            setOpenMenuId(null);
                                                                            setHoveredId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        Delete message
                                                                    </button>
                                                                )}
                                                                {!isMine && (
                                                                    <div className="px-3 py-2.5 text-xs text-zinc-500">No actions available</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {typingMembers && typingMembers.length > 0 && (
                            <div className="flex items-end gap-2 justify-start mt-1">
                                <div className="w-8 shrink-0">
                                    <Avatar className="h-8 w-8 border border-zinc-800">
                                        <AvatarImage src={(typingMembers[0] as any)?.imageUrl} />
                                        <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                                            {(typingMembers[0] as any)?.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="bg-zinc-800 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scroll-to-bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 hover:bg-zinc-700 text-white rounded-full px-4 py-2 text-xs font-medium shadow-lg flex items-center gap-1.5 transition-all z-10"
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                    New messages
                </button>
            )}
        </div>
    );
}
