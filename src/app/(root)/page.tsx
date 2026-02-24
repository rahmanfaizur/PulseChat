import { MessageSquarePlus } from "lucide-react";

export default function ChatPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950/80 text-center h-full">
            <div className="bg-zinc-900 rounded-full p-6 mb-6 shadow-sm border border-white/5">
                <MessageSquarePlus className="w-12 h-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-zinc-100 tracking-tight">Welcome to PulseChat</h2>
            <p className="text-zinc-500 max-w-md mx-auto">
                Select a conversation from the sidebar or search for a user to start a new chat.
            </p>
        </div>
    );
}
