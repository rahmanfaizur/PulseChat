import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatHeaderProps {
    name: string;
    imageUrl?: string;
    isOnline?: boolean;
}

export default function ChatHeader({ name, imageUrl, isOnline }: ChatHeaderProps) {
    return (
        <header className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center px-6 shrink-0 shadow-sm z-10">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Avatar className="h-10 w-10 border border-zinc-800">
                        <AvatarImage src={imageUrl} alt={name || "User"} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-400">
                            {name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-900 rounded-full"></span>
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">{name}</h2>
                    <p className="text-xs text-zinc-500">{isOnline ? "Active now" : "Offline"}</p>
                </div>
            </div>
        </header>
    );
}
