import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Verify membership
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id)
            )
            .unique();

        if (!membership) throw new Error("Not a member of this conversation");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id,
            content: args.content,
            isDeleted: false,
        });

        // Automatically mark as read for sender
        await ctx.db.patch(membership._id, {
            lastReadMessageId: messageId,
        });

        return messageId;
    },
});

export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .order("asc")
            .collect();

        // Map sender info and reactions
        const messagesWithDetails = await Promise.all(
            messages.map(async (msg: any) => {
                const sender = (await ctx.db.get(msg.senderId)) as any;

                const rawReactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_messageId", (q: any) => q.eq("messageId", msg._id))
                    .collect();

                // Group by emoji
                const reactionsMap = rawReactions.reduce((acc: any, r: any) => {
                    if (!acc[r.reaction]) acc[r.reaction] = [];
                    acc[r.reaction].push(r.userId);
                    return acc;
                }, {});

                const reactions = Object.keys(reactionsMap).map((emoji) => ({
                    emoji,
                    userIds: reactionsMap[emoji]
                }));

                return {
                    ...msg,
                    sender: sender ? { name: sender.name, imageUrl: sender.imageUrl, isOnline: sender.isOnline } : null,
                    isMine: msg.senderId === user._id,
                    reactions,
                };
            })
        );

        return messagesWithDetails;
    },
});

export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (message.senderId !== user._id) {
            throw new Error("Can only delete your own messages");
        }

        await ctx.db.patch(args.messageId, {
            isDeleted: true,
            content: "This message was deleted",
        });
    },
});
