import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        reaction: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Check if message exists
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        // Check if user already reacted with THIS emoji
        const existingReaction = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q: any) => q.eq("messageId", args.messageId))
            .filter((q: any) =>
                q.and(
                    q.eq(q.field("userId"), user._id),
                    q.eq(q.field("reaction"), args.reaction)
                )
            )
            .unique();

        if (existingReaction) {
            // Remove it
            await ctx.db.delete(existingReaction._id);
        } else {
            // Add it
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: user._id,
                reaction: args.reaction,
            });
        }
    },
});
