"use client";

import { useUser } from "@clerk/nextjs";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useCallback, useState } from "react";
import { formatTimestamp } from "@/lib/utils";
import { ArrowDown, MoreHorizontal, Trash2, Reply, Forward, SmilePlus, X, MessageSquare } from "lucide-react";
import { ReplyContext } from "./ChatView";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface MessageListProps {
    conversationId: Id<"conversations">;
    onReply: (ctx: ReplyContext) => void;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export default function MessageList({ conversationId, onReply }: MessageListProps) {
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const typingMembers = useQuery(api.members.getTypingMembers, { conversationId });
    const markAsRead = useMutation(api.members.markAsRead);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.reactions.toggleReaction);
    const forwardMessage = useMutation(api.messages.forwardMessage);
    const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
    const router = useRouter();

    const scrollRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const prevInnerHeight = useRef<number | null>(null);

    const [showScrollButton, setShowScrollButton] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const [reactionsModalMsgId, setReactionsModalMsgId] = useState<string | null>(null);
    const [activeReactionTab, setActiveReactionTab] = useState<string | null>(null);
    const { user } = useUser();

    // Derive the active reactions message alive from the Convex query
    const reactionsModalMsg = messages?.find(m => m._id === reactionsModalMsgId);

    // Auto-close modal or switch tabs if Convex updates and removes the current tab
    useEffect(() => {
        if (reactionsModalMsgId && (!reactionsModalMsg || !reactionsModalMsg.reactions || reactionsModalMsg.reactions.length === 0)) {
            setReactionsModalMsgId(null);
        } else if (reactionsModalMsg && activeReactionTab) {
            const hasTab = reactionsModalMsg.reactions.find((r: any) => r.emoji === activeReactionTab);
            if (!hasTab) setActiveReactionTab(reactionsModalMsg.reactions[0]?.emoji || null);
        }
    }, [reactionsModalMsg, activeReactionTab, reactionsModalMsgId]);

    // Scroll logic (article pattern)
    useEffect(() => {
        const outer = scrollRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;
        const outerH = outer.clientHeight;
        const innerH = inner.clientHeight;
        const scrollTop = outer.scrollTop;
        const wasAtBottom = !prevInnerHeight.current || scrollTop >= prevInnerHeight.current - outerH - 60;
        if (wasAtBottom) {
            outer.scrollTo({ top: innerH - outerH, left: 0, behavior: prevInnerHeight.current ? "smooth" : "auto" });
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
        setDeleteTarget(null);
    }, [conversationId]);

    const scrollToBottom = useCallback(() => {
        const outer = scrollRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;
        outer.scrollTo({ top: inner.clientHeight - outer.clientHeight, left: 0, behavior: "smooth" });
        setShowScrollButton(false);
    }, []);

    // Mark as read immediately when conversation is opened or new messages arrive
    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        const doMark = () => {
            if (document.visibilityState === "visible") {
                markAsRead({ conversationId, messageId: lastMessage._id }).catch(() => { });
            }
        };

        doMark();

        document.addEventListener("visibilitychange", doMark);
        return () => document.removeEventListener("visibilitychange", doMark);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages?.length, conversationId]);

    const handleForward = (msg: any) => {
        forwardMessage({ conversationId, content: msg.content })
            .then(() => toast.success("Message forwarded"))
            .catch(() => toast.error("Failed to forward"));
    };

    const handleReply = (msg: any) => {
        onReply({
            messageId: msg._id,
            senderName: msg.isMine ? "You" : msg.sender?.name || "Unknown",
            content: msg.content,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteMessage({ messageId: deleteTarget.id as Id<"messages"> });
            toast.success("Message deleted");
            setDeleteTarget(null);
        } catch {
            toast.error("Failed to delete message");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMessageUser = async (otherUserId: Id<"users">) => {
        try {
            const newConversationId = await getOrCreateConversation({ otherUserId });
            router.push(`/${newConversationId}`);
        } catch (error) {
            console.error("Failed to start conversation:", error);
            toast.error("Failed to jump to direct message.");
        }
    };

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
        <>
            <div className="flex-1 min-h-0 relative bg-gradient-to-br from-[#2d1065] via-[#1a0533] to-[#0d0120]">
                <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
                    <div ref={innerRef} className="py-6">
                        <div className="mx-auto w-full flex flex-col">
                            {messages.map((msg: any, index: number) => {
                                const isMine = msg.isMine;
                                const isHovered = hoveredId === msg._id;
                                const isNewGroup = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
                                const showAvatar = isNewGroup;
                                const showName = isNewGroup;

                                return (
                                    <div
                                        key={msg._id}
                                        id={`msg-${msg._id}`}
                                        className={`group flex items-start gap-4 px-6 py-1 hover:bg-white/[0.03] transition-colors relative ${showAvatar ? "mt-5" : ""} ${highlightedId === msg._id ? "bg-violet-500/10 !bg-violet-500/10" : ""}`}
                                        onMouseEnter={() => setHoveredId(msg._id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 shrink-0 flex justify-center mt-0.5 relative z-10">
                                            {showAvatar ? (
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border border-white/5 shadow-md">
                                                        <AvatarImage src={msg.sender?.imageUrl} alt={msg.sender?.name || ""} />
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-sm font-medium text-white">
                                                            {msg.sender?.name?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {msg.sender?.isOnline && (
                                                        <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-[2.5px] border-[#09050d]"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 select-none pt-1 transition-opacity">
                                                    {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex flex-col min-w-0 flex-1 relative group/content">
                                            {showName && (
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className={`text-[15px] font-semibold tracking-wide ${isMine ? "text-indigo-300" : "bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400"}`}>
                                                        {msg.sender?.name}
                                                    </span>
                                                    <span className="text-[11px] text-white/30 font-medium">
                                                        {formatTimestamp(msg._creationTime)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Reply preview */}
                                            {msg.replyTo && (
                                                <div
                                                    className="mb-1.5 flex items-center gap-2 cursor-pointer text-white/40 hover:text-white/70 transition-colors group/reply"
                                                    onClick={() => {
                                                        const el = document.getElementById(`msg-${msg.replyTo.messageId}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                                                            setHighlightedId(msg.replyTo.messageId);
                                                            setTimeout(() => setHighlightedId(null), 1800);
                                                        }
                                                    }}
                                                >
                                                    <div className="w-8 border-t-2 border-l-2 border-white/10 rounded-tl-xl h-5 absolute -left-[38px] top-2" />
                                                    <Avatar className="h-5 w-5 border border-white/10 shrink-0">
                                                        <AvatarImage src={msg.replyTo.senderImageUrl} />
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-[9px] text-white">
                                                            {msg.replyTo.senderName?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-semibold text-violet-300/70 group-hover/reply:text-violet-300 transition-colors">{msg.replyTo.senderName}</span>
                                                    <span className="text-xs truncate max-w-sm">{msg.replyTo.content}</span>
                                                </div>
                                            )}

                                            <div className="text-zinc-200">
                                                <p className={`whitespace-pre-wrap break-words leading-relaxed text-[15px] ${msg.isDeleted ? "italic opacity-40 text-sm" : ""}`}>
                                                    {msg.content}
                                                </p>
                                            </div>

                                            {/* Reactions */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <TooltipProvider delayDuration={300}>
                                                    <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
                                                        {msg.reactions.map(({ emoji, users, userIds }: { emoji: string; users: any[]; userIds: any[] }) => {
                                                            const safeUsers = users ?? [];
                                                            const hasReacted = safeUsers.some(u => u.clerkId === user?.id);
                                                            const participantNames = safeUsers.map(u => u.name?.split(" ")[0]).join(", ");
                                                            return (
                                                                <Tooltip key={emoji}>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={() => {
                                                                                setReactionsModalMsgId(msg._id);
                                                                                setActiveReactionTab(emoji);
                                                                            }}
                                                                            className={`px-2 py-0.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 border transition-all ${hasReacted
                                                                                ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-300 shadow-sm"
                                                                                : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                                                                                }`}
                                                                        >
                                                                            <span>{emoji}</span>
                                                                            <span className="text-[11px] leading-none font-bold">{userIds.length}</span>
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-zinc-950 border border-white/10 text-zinc-300 text-xs px-2.5 py-1.5 flex items-center gap-2 rounded-lg shadow-xl shadow-black/50">
                                                                        <span className="text-lg leading-none">{emoji}</span>
                                                                        <span>
                                                                            <span className="font-medium text-white">{participantNames}</span> reacted
                                                                        </span>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </div>
                                                </TooltipProvider>
                                            )}

                                            {/* Hover action toolbar */}
                                            {(isHovered || openDropdownId === msg._id) && !msg.isDeleted && (
                                                <div className="absolute right-4 -top-3 z-20 flex items-center shrink-0 bg-zinc-800/90 backdrop-blur-md rounded-lg shadow-md border border-white/10 overflow-hidden">
                                                    {EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction({ messageId: msg._id, reaction: emoji }).catch(() => { })}
                                                            className="px-2 py-1.5 hover:bg-white/10 transition-colors text-[14px]"
                                                            title={emoji}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                    <span className="w-px h-4 bg-white/10 mx-0.5" />
                                                    <button
                                                        onClick={() => handleReply(msg)}
                                                        className="px-2 py-1.5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-100"
                                                        title="Reply"
                                                    >
                                                        <Reply className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleForward(msg)}
                                                        className="px-2 py-1.5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-100"
                                                        title="Forward"
                                                    >
                                                        <Forward className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="w-px h-4 bg-white/10 mx-0.5" />
                                                    <DropdownMenu
                                                        open={openDropdownId === msg._id}
                                                        onOpenChange={(open) => {
                                                            setOpenDropdownId(open ? msg._id : null);
                                                            if (!open) setHoveredId(null);
                                                        }}
                                                    >
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="px-2 py-1.5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-100"
                                                                title="More options"
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            side="bottom"
                                                            className="w-44 bg-zinc-900 border-white/10 text-zinc-100"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() => handleReply(msg)}
                                                                className="gap-2.5 cursor-pointer focus:bg-white/10 focus:text-zinc-100"
                                                            >
                                                                <Reply className="w-3.5 h-3.5 text-zinc-400" />
                                                                Reply
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleForward(msg)}
                                                                className="gap-2.5 cursor-pointer focus:bg-white/10 focus:text-zinc-100"
                                                            >
                                                                <Forward className="w-3.5 h-3.5 text-zinc-400" />
                                                                Forward
                                                            </DropdownMenuItem>
                                                            {msg.reactions && msg.reactions.length > 0 && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setReactionsModalMsg(msg);
                                                                        setActiveReactionTab(msg.reactions[0]?.emoji || null);
                                                                    }}
                                                                    className="gap-2.5 cursor-pointer focus:bg-white/10 focus:text-zinc-100"
                                                                >
                                                                    <SmilePlus className="w-3.5 h-3.5 text-zinc-400" />
                                                                    View Reactions
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!isMine && (
                                                                <>
                                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleMessageUser(msg.senderId)}
                                                                        className="gap-2.5 cursor-pointer focus:bg-white/10 focus:text-zinc-100"
                                                                    >
                                                                        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                                                                        Message User...
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {isMine && (
                                                                <>
                                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                                    <DropdownMenuItem
                                                                        variant="destructive"
                                                                        onClick={() => setDeleteTarget({ id: msg._id })}
                                                                        className="gap-2.5 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing indicator */}
                            {typingMembers && typingMembers.length > 0 && (
                                <div className="flex items-start gap-4 px-6 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="w-10 shrink-0 flex justify-center mt-0.5">
                                        <Avatar className="h-10 w-10 border border-white/5 shadow-md">
                                            <AvatarImage src={(typingMembers[0] as any)?.imageUrl} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-medium text-white">
                                                {(typingMembers[0] as any)?.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5 pt-1">
                                        <span className="text-[13px] font-medium text-white/50">
                                            {typingMembers.length === 1
                                                ? `${(typingMembers[0] as any)?.name?.split(" ")[0] || "Someone"} is typing`
                                                : typingMembers.length === 2
                                                    ? `${(typingMembers[0] as any)?.name?.split(" ")[0]} and ${(typingMembers[1] as any)?.name?.split(" ")[0]} are typing`
                                                    : "Several people are typing"}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.32s]"></span>
                                            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.16s]"></span>
                                            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll-to-bottom */}
                {showScrollButton && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800/90 backdrop-blur-md border border-white/10 hover:bg-zinc-700 text-white rounded-full px-4 py-2 text-xs font-medium shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-1.5 transition-all z-10"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                        New messages
                    </button>
                )}
            </div>

            {/* Delete confirmation — shadcn Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent className="bg-zinc-900 border-white/10 text-zinc-100 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-zinc-100">
                            <div className="p-1.5 bg-red-500/10 rounded-full">
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </div>
                            Delete message?
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            This action cannot be undone. The message will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                            className="bg-transparent border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reactions Detail Dialog (Discord-style) */}
            <Dialog open={!!reactionsModalMsg} onOpenChange={(open) => { if (!open) setReactionsModalMsgId(null); }}>
                <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-zinc-100 max-w-md rounded-lg p-0 shadow-2xl overflow-hidden sm:max-w-[425px]">
                    <DialogHeader className="px-5 pt-5 pb-4 border-b border-[#1E1F22]">
                        <DialogTitle className="text-base font-bold text-zinc-100">Reactions</DialogTitle>
                    </DialogHeader>

                    <div className="flex h-[350px]">
                        {/* Emoji Tabs */}
                        <div className="w-16 sm:w-20 bg-[#2B2D31] border-r border-[#1E1F22] overflow-y-auto py-2 flex flex-col items-center">
                            {reactionsModalMsg?.reactions.map((r: any) => (
                                <button
                                    key={r.emoji}
                                    onClick={() => setActiveReactionTab(r.emoji)}
                                    className={`w-12 sm:w-16 py-2 px-1 mb-1 rounded flex items-center justify-center gap-1.5 transition-colors ${activeReactionTab === r.emoji
                                        ? "bg-[#404249]"
                                        : "hover:bg-[#35373C]"
                                        }`}
                                >
                                    <span className="text-xl leading-none">{r.emoji}</span>
                                    <span className="text-xs font-semibold text-zinc-300">{r.userIds.length}</span>
                                </button>
                            ))}
                        </div>

                        {/* Users List */}
                        <div className="flex-1 bg-[#2B2D31] overflow-y-auto p-2">
                            {reactionsModalMsg?.reactions
                                .find((r: any) => r.emoji === activeReactionTab)
                                ?.users?.map((u: any) => (
                                    <div key={u._id} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#35373C] transition-colors cursor-default">
                                        <Avatar className="h-8 w-8 border-none bg-[#1E1F22]">
                                            <AvatarImage src={u.imageUrl} alt={u.name} />
                                            <AvatarFallback className="bg-indigo-600 text-[10px] text-white">
                                                {u.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                                                {u.name}
                                                {u.clerkId === user?.id && <span className="text-[10px] text-zinc-500 font-normal bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                                            </span>
                                        </div>
                                        {u.clerkId === user?.id && (
                                            <button
                                                onClick={() => {
                                                    toggleReaction({ messageId: reactionsModalMsg?._id, reaction: activeReactionTab! }).catch(() => { });
                                                }}
                                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                                                title="Remove Reaction"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </>
    );
}
