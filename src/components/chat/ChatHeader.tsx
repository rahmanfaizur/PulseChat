import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
    name: string;
    imageUrl?: string;
    isOnline?: boolean;
}

export default function ChatHeader({ name, imageUrl, isOnline }: ChatHeaderProps) {
    return (
        <header className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center px-4 md:px-6 shrink-0 shadow-sm z-10 w-full">
            <div className="flex items-center space-x-3 md:space-x-4 w-full">
                <Link href="/" className="md:hidden flex items-center justify-center p-2 mr-1 rounded-full hover:bg-zinc-800/50 text-zinc-400 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="relative">
                    <Avatar className="h-10 w-10 border border-zinc-800">
                        <AvatarImage src={imageUrl} alt={name || "User"} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-400">
                            {name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-zinc-900"></span>
                        </span>
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">{name}</h2>
                    <div className="flex items-center gap-1.5">
                        {isOnline ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                <p className="text-xs text-emerald-400 font-medium">Active now</p>
                            </>
                        ) : (
                            <p className="text-xs text-zinc-500">Offline</p>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
