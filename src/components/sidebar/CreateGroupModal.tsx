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
import { Check, Loader2 } from "lucide-react";
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
    const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const availableUsers = users?.filter((u: any) => u.clerkId !== user?.id) || [];

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
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Team"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">
                            Select Members <span className="text-zinc-500">({selectedUsers.size} selected)</span>
                        </label>
                        <ScrollArea className="h-48 border border-zinc-800 rounded-lg bg-zinc-900/50 p-1">
                            {availableUsers.map((u: any) => {
                                const isSelected = selectedUsers.has(u._id);
                                return (
                                    <button
                                        key={u._id}
                                        onClick={() => toggleUser(u._id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${isSelected ? "bg-indigo-600/20 hover:bg-indigo-600/30" : "hover:bg-zinc-800"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8 border border-zinc-800">
                                                <AvatarImage src={u.imageUrl} />
                                                <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
                                                    {u.name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            {availableUsers.length === 0 && (
                                <div className="p-4 text-center text-zinc-500 text-sm">
                                    No other users available
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim() || selectedUsers.size < 1}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
