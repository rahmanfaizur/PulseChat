import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx: MutationCtx, args: { conversationId: string }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId_userId", (q: any) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id)
            )
            .unique();

        if (!membership) throw new Error("Not a member of this conversation");

        // set typingUntil to 3 seconds from now
        await ctx.db.patch(membership._id, {
            typingUntil: Date.now() + 3000,
        });
    },
});

export const getTypingMembers = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx: QueryCtx, args: { conversationId: string }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        const now = Date.now();
        const typingMembers = memberships.filter(
            (m: any) => m.userId !== user._id && m.typingUntil && m.typingUntil > now
        );

        const users = await Promise.all(
            typingMembers.map(async (m: any) => await ctx.db.get(m.userId))
        );

        return users.filter((u: any) => u !== null);
    },
});

export const markAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        messageId: v.id("messages"),
    },
    handler: async (ctx: MutationCtx, args: { conversationId: string; messageId: string }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId_userId", (q: any) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id)
            )
            .unique();

        if (!membership) throw new Error("Not a member of this conversation");

        await ctx.db.patch(membership._id, {
            lastReadMessageId: args.messageId as Id<"messages">,
        });
    },
});
