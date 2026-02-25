"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface MessageInputProps {
    conversationId: Id<"conversations">;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
    const [content, setContent] = useState("");
    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.members.setTyping);
    const clearTyping = useMutation(api.members.clearTyping);
    const [isSending, setIsSending] = useState(false);

    const lastTyped = useRef(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

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

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            clearTyping({ conversationId }).catch(() => { });
            lastTyped.current = 0;
        }, 7000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSending) return;

        setIsSending(true);
        const text = content.trim();
        setContent("");

        try {
            await Promise.all([
                sendMessage({ conversationId, content: text }),
                clearTyping({ conversationId })
            ]);
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message. Please try again.");
            setContent(text); // Revert back the input if failed
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-4 bg-zinc-950 shrink-0">
            <form onSubmit={handleSubmit} className="flex relative items-end max-w-4xl mx-auto w-full gap-2">
                <div className="relative w-full flex items-center">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => handleTyping(e.target.value)}
                        disabled={isSending}
                        placeholder="Type a message..."
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
