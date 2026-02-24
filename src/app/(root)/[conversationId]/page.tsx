import ChatView from "@/components/chat/ChatView";
import { Id } from "../../../../convex/_generated/dataModel";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
    const { conversationId } = await params;

    return (
        <div className="h-full w-full group chat-active flex flex-col">
            <ChatView conversationId={conversationId as Id<"conversations">} />
        </div>
    );
}
