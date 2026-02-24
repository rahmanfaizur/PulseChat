import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getOrCreateConversation = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Check if a 1-on-1 conversation already exists
        const myMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .collect();

        for (const membership of myMemberships) {
            const conversation = await ctx.db.get(membership.conversationId);
            if (!conversation || conversation.isGroup) continue;

            const otherMembership = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversationId_userId", (q: any) =>
                    q.eq("conversationId", membership.conversationId).eq("userId", args.otherUserId)
                )
                .unique();

            if (otherMembership) {
                return conversation._id; // Existing 1-on-1 found
            }
        }

        // Create new conversation
        const conversationId = await ctx.db.insert("conversations", {
            isGroup: false,
        });

        // Add both members
        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: user._id,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: args.otherUserId,
        });

        return conversationId;
    },
});

export const getMyConversations = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .collect();

        const conversations = await Promise.all(
            memberships.map(async (membership: any) => {
                const conversation = await ctx.db.get(membership.conversationId);
                if (!conversation) return null;

                const otherMemberships = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conversation._id))
                    .collect();

                const otherMembersRaw = await Promise.all(
                    otherMemberships
                        .filter((m: any) => m.userId !== user._id)
                        .map(async (m: any) => await ctx.db.get(m.userId))
                );

                const threshold = Date.now() - 60000;
                const otherMembers = otherMembersRaw.map((m: any) => m ? {
                    ...m,
                    isOnline: m.isOnline && m.lastSeen > threshold
                } : null);

                // Get last message
                const lastMessage = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conversation._id))
                    .order("desc")
                    .first();

                let unreadCount = 0;
                if (membership.lastReadMessageId) {
                    const lastRead = await ctx.db.get(membership.lastReadMessageId as Id<"messages">);
                    if (lastRead) {
                        const unread = await ctx.db
                            .query("messages")
                            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conversation._id))
                            .filter((q: any) => q.gt(q.field("_creationTime"), lastRead._creationTime))
                            .collect();
                        unreadCount = unread.length;
                    }
                } else {
                    const allMsgs = await ctx.db
                        .query("messages")
                        .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conversation._id))
                        .collect();
                    unreadCount = allMsgs.length;
                }

                return {
                    ...conversation,
                    otherMembers: otherMembers.filter((m: any) => m !== null),
                    lastMessage,
                    unreadCount,
                };
            })
        );

        return conversations
            .filter((c: any) => c !== null)
            .sort((a: any, b: any) => {
                const aTime = a.lastMessage?._creationTime || a._creationTime;
                const bTime = b.lastMessage?._creationTime || b._creationTime;
                return bTime - aTime;
            });
    },
});
