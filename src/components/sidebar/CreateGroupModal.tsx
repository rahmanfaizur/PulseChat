"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Check, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
    const { user } = useUser();
    const router = useRouter();
    const users = useQuery(api.users.getUsers);
    const createGroup = useMutation(api.conversations.createGroup);

    const [name, setName] = useState("");
    const [groupImageUrl, setGroupImageUrl] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const availableUsers = (users?.filter((u: any) => u.clerkId !== user?.id) || [])
        .filter((u: any) => !memberSearch.trim() || u.name?.toLowerCase().includes(memberSearch.toLowerCase()));

    const toggleUser = (userId: Id<"users">) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Group name is required");
            return;
        }
        if (selectedUsers.size < 1) {
            toast.error("Select at least 1 other member for a group chat");
            return;
        }

        setIsLoading(true);
        try {
            const conversationId = await createGroup({
                name: name.trim(),
                memberIds: Array.from(selectedUsers),
                imageUrl: groupImageUrl.trim() || undefined,
            });
            toast.success("Group created successfully");
            onClose();
            router.push(`/${conversationId}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error("Failed to create group");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#2d1065] via-[#1a0533] to-[#0d0120] border-purple-500/20 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-purple-100">Create Group Chat</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Group image preview + URL input */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl border border-purple-500/20 bg-purple-950/40 overflow-hidden shrink-0 flex items-center justify-center">
                            {groupImageUrl ? (
                                <img src={groupImageUrl} alt="Group" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                                <span className="text-2xl font-bold text-purple-300/30">{name?.charAt(0) || "G"}</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-sm font-medium text-purple-200/70">Group Photo URL <span className="text-purple-400/30 font-normal">(optional)</span></label>
                            <input
                                type="url"
                                value={groupImageUrl}
                                onChange={(e) => setGroupImageUrl(e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                                className="w-full bg-purple-950/40 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-purple-300/20 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-purple-200/70">Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Team"
                            className="w-full bg-purple-950/40 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-purple-300/30 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-purple-200/70">
                            Select Members <span className="text-purple-400/50">({selectedUsers.size} selected)</span>
                        </label>

                        {/* Member search bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400/50" />
                            <input
                                type="text"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Search members..."
                                className="w-full bg-purple-950/40 border border-purple-500/20 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-purple-300/30 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                            />
                        </div>

                        <ScrollArea className="h-48 border border-purple-500/15 rounded-lg bg-purple-950/20 p-1">
                            {availableUsers.map((u: any) => {
                                const isSelected = selectedUsers.has(u._id);
                                return (
                                    <button
                                        key={u._id}
                                        onClick={() => toggleUser(u._id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${isSelected ? "bg-violet-600/20 hover:bg-violet-600/30" : "hover:bg-purple-500/10"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8 border border-purple-500/20">
                                                <AvatarImage src={u.imageUrl} />
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-700 text-xs text-white">
                                                    {u.name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            {availableUsers.length === 0 && (
                                <div className="p-4 text-center text-purple-300/40 text-sm">
                                    {memberSearch ? "No users match your search" : "No other users available"}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-purple-300/60 hover:bg-purple-900/30 hover:text-purple-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim() || selectedUsers.size < 1}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
