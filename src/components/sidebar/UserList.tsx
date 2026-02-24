import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
return (
    <ScrollArea className="h-full">
        <div className="p-3 space-y-1">
            {filteredUsers.map((u) => (
                <button
                    key={u._id}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
                >
                    <div className="relative">
                        <Avatar className="h-12 w-12 border border-zinc-800">
                            <AvatarImage src={u.imageUrl} alt={u.name || "User"} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400">
                                {u.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        {u.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"></span>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-zinc-100 truncate">{u.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                    </div>
                </button>
            ))}
        </div>
    </ScrollArea>
);
}
