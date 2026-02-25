"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Skeleton } from "@/components/ui/skeleton";
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
        <div className="flex-1 flex flex-col bg-zinc-950/80 relative overflow-hidden">
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
    );
}
