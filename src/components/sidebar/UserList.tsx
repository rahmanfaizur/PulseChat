import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

export default function UserList({ searchQuery }: { searchQuery: string }) {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const activeConversationId = params.conversationId as string;

    const users = useQuery(api.users.getUsers);
    const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(
            (u: any) =>
                u.clerkId !== user?.id &&
                (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [users, user?.id, searchQuery]);

    const handleStartConversation = async (otherUserId: Id<"users">) => {
        try {
            const conversationId = await getOrCreateConversation({ otherUserId });
            router.push(`/${conversationId}`);
        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    };

    if (users === undefined) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full bg-zinc-800" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (filteredUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full text-zinc-500">
                <div className="bg-zinc-900 rounded-full p-4 mb-4">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <p className="font-medium text-zinc-300">No users found</p>
                <p className="text-sm mt-1">Check back later or adjust search.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
                {filteredUsers.map((u: any) => (
                    <button
                        key={u._id}
                        onClick={() => handleStartConversation(u._id)}
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
