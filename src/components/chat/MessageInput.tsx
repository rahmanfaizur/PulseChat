"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface MessageInputProps {
    conversationId: Id<"conversations">;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
    const [content, setContent] = useState("");
    const sendMessage = useMutation(api.messages.sendMessage);
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSending) return;

        setIsSending(true);
        const text = content.trim();
        setContent("");

        try {
            await sendMessage({ conversationId, content: text });
        } catch (error) {
            console.error("Failed to send message", error);
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
                        onChange={(e) => setContent(e.target.value)}
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
