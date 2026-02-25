"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal, X, CornerUpLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { ReplyContext } from "./ChatView";

interface MessageInputProps {
    conversationId: Id<"conversations">;
    replyTo: ReplyContext | null;
    onCancelReply: () => void;
}

export default function MessageInput({ conversationId, replyTo, onCancelReply }: MessageInputProps) {
    const [content, setContent] = useState("");
    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.members.setTyping);
    const clearTyping = useMutation(api.members.clearTyping);
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const lastTyped = useRef(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    // Focus input when reply is set
    useEffect(() => {
        if (replyTo) inputRef.current?.focus();
    }, [replyTo]);

    const handleTyping = (val: string) => {
        setContent(val);

        if (val.trim() === "") {
            clearTyping({ conversationId }).catch(() => { });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            return;
        }

        const now = Date.now();
        if (now - lastTyped.current > 1500) {
            lastTyped.current = now;
            setTyping({ conversationId }).catch(() => { });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            clearTyping({ conversationId }).catch(() => { });
            lastTyped.current = 0;
        }, 2500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSending) return;

        setIsSending(true);
        const text = content.trim();
        const replyToId = replyTo?.messageId;
        setContent("");
        onCancelReply();

        try {
            await Promise.all([
                sendMessage({ conversationId, content: text, replyToId }),
                clearTyping({ conversationId })
            ]);
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message. Please try again.");
            setContent(text);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-4 bg-zinc-950 shrink-0">
            {/* Reply preview banner */}
            {replyTo && (
                <div className="max-w-4xl mx-auto w-full mb-2 flex items-center gap-2 bg-zinc-800/70 border border-white/10 rounded-xl px-3 py-2">
                    <CornerUpLeft className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-indigo-400 block">{replyTo.senderName}</span>
                        <span className="text-xs text-zinc-400 truncate block">{replyTo.content}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        className="p-1 rounded-full hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex relative items-end max-w-4xl mx-auto w-full gap-2">
                <div className="relative w-full flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={content}
                        onChange={(e) => handleTyping(e.target.value)}
                        disabled={isSending}
                        placeholder={replyTo ? `Replying to ${replyTo.senderName}...` : "Type a message..."}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-4 pr-12 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!content.trim() || isSending}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-full transition-all flex items-center justify-center shrink-0"
                    >
                        <SendHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
