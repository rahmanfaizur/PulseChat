import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Document, Id } from "./_generated/dataModel";

export const syncUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (
        ctx: MutationCtx,
        args: {
            clerkId: string;
            email: string;
            name?: string | undefined;
            imageUrl?: string | undefined;
        },
    ): Promise<Id<"users">> => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                imageUrl: args.imageUrl,
                email: args.email,
                isOnline: true,
                lastSeen: Date.now(),
            });
            return existingUser._id;
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            name: args.name,
            imageUrl: args.imageUrl,
            isOnline: true,
            lastSeen: Date.now(),
        });
    },
});

export const getUsers = query({
    handler: async (ctx: QueryCtx): Promise<(Document<"users"> & { isOnline: boolean })[]> => {
        const users = await ctx.db.query("users").collect();

        // Consider users offline if not seen for 60 seconds
        const threshold = Date.now() - 60000;

        return users.map((user: Document<"users">) => ({
            ...user,
            isOnline: user.isOnline && user.lastSeen > threshold
        }));
    },
});

export const updatePresence = mutation({
    args: {
        clerkId: v.string(),
        isOnline: v.boolean(),
    },
    handler: async (
        ctx: MutationCtx,
        args: { clerkId: string; isOnline: boolean },
    ): Promise<void> => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: args.isOnline,
                lastSeen: Date.now(),
            });
        }
    },
});
