"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import UserList from "./UserList";
import ConversationList from "./ConversationList";
import CreateGroupModal from "./CreateGroupModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const { user } = useUser();

    const isSearching = searchQuery.trim().length > 0;

    return (
        <aside className="w-full bg-gradient-to-b from-[#2d1065]/80 via-[#1a0533]/80 to-[#0d0120]/80 backdrop-blur-md flex flex-col h-full shrink-0">
            {/* Search + group button */}
            <div className="p-4 border-b border-purple-500/10 bg-white/[0.02] shrink-0 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isSearching ? "Search users..." : "Search conversations..."}
                        className="w-full bg-purple-950/40 border border-purple-500/20 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-purple-300/30 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                </div>
                <button
                    onClick={() => setIsGroupModalOpen(true)}
                    className="p-2.5 bg-purple-900/30 hover:bg-purple-800/40 rounded-full border border-purple-500/20 transition-colors text-purple-300/70 hover:text-purple-200 shrink-0"
                    title="Create Group Chat"
                >
                    <Users className="w-4 h-4" />
                </button>
            </div>

            {/* Conversations / Users list */}
            <div className="flex-1 overflow-hidden relative">
                {isSearching ? (
                    <UserList searchQuery={searchQuery} />
                ) : (
                    <ConversationList searchQuery={searchQuery} />
                )}
            </div>

            <CreateGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
            />

            {/* Current user bar — Discord-style */}
            {user && (
                <div className="shrink-0 border-t border-purple-500/10 bg-white/[0.03] backdrop-blur-md px-3 py-3 flex items-center gap-3">
                    <div className="relative shrink-0">
                        <Avatar className="h-9 w-9 border border-purple-500/30">
                            <AvatarImage src={user.imageUrl} alt={user.fullName || "You"} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-sm font-medium">
                                {user.firstName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        {/* Always-on green dot for self */}
                        <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-[1.5px] border-[#1a0533]"></span>
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-100 truncate">
                            {user.fullName || user.firstName || "You"}
                        </p>
                        <p className="text-[11px] text-purple-400/50 truncate">
                            {user.emailAddresses[0]?.emailAddress}
                        </p>
                    </div>
                    <div className="shrink-0">
                        <UserButton
                            afterSignOutUrl="/sign-in"
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-7 h-7",
                                    userButtonTrigger: "focus:shadow-none",
                                },
                            }}
                        />
                    </div>
                </div>
            )}
        </aside>
    );
}
