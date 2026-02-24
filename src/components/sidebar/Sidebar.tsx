"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import UserList from "./UserList";
import ConversationList from "./ConversationList";

export default function Sidebar() {
    const [searchQuery, setSearchQuery] = useState("");

    const isSearching = searchQuery.trim().length > 0;

    return (
        <aside className="w-80 border-r border-white/10 bg-zinc-950/50 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isSearching ? "Search users..." : "Search conversations..."}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {isSearching ? (
                    <UserList searchQuery={searchQuery} />
                ) : (
                    <ConversationList searchQuery={searchQuery} />
                )}
            </div>
        </aside>
    );
}
