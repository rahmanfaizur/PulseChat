import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        replyToId: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

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
            replyToId: args.replyToId,
        });

        await ctx.db.patch(membership._id, {
            lastReadMessageId: messageId,
        });

        return messageId;
    },
});

export const forwardMessage = mutation({
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
            content: `↪ ${args.content}`,
            isDeleted: false,
        });

        await ctx.db.patch(membership._id, { lastReadMessageId: messageId });
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

        const messagesWithDetails = await Promise.all(
            messages.map(async (msg: any) => {
                const sender = (await ctx.db.get(msg.senderId)) as any;

                const rawReactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_messageId", (q: any) => q.eq("messageId", msg._id))
                    .collect();

                const reactionsMap = rawReactions.reduce((acc: any, r: any) => {
                    if (!acc[r.reaction]) acc[r.reaction] = [];
                    acc[r.reaction].push(r.userId);
                    return acc;
                }, {});

                const reactions = await Promise.all(
                    Object.keys(reactionsMap).map(async (emoji) => {
                        const userIds = reactionsMap[emoji];
                        const users = await Promise.all(
                            userIds.map(async (uid: any) => {
                                const u = await ctx.db.get(uid) as any;
                                return u ? { _id: u._id, name: u.name, imageUrl: u.imageUrl, clerkId: u.clerkId } : null;
                            })
                        );
                        return {
                            emoji,
                            userIds,
                            users: users.filter(Boolean),
                        };
                    })
                );

                // Fetch replied-to message if present
                let replyTo = null;
                if (msg.replyToId) {
                    const replyMsg = await ctx.db.get(msg.replyToId) as any;
                    if (replyMsg) {
                        const replySender = await ctx.db.get(replyMsg.senderId) as any;
                        replyTo = {
                            messageId: replyMsg._id,
                            content: replyMsg.isDeleted ? "This message was deleted" : replyMsg.content,
                            senderName: replySender?.name || "Unknown",
                            senderImageUrl: replySender?.imageUrl || null,
                        };
                    }
                }

                return {
                    ...msg,
                    sender: sender ? { name: sender.name, imageUrl: sender.imageUrl, isOnline: sender.isOnline } : null,
                    isMine: msg.senderId === user._id,
                    reactions,
                    replyTo,
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
