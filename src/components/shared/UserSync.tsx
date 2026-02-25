"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);
    const updatePresence = useMutation(api.users.updatePresence);

    useEffect(() => {
        if (isLoaded && user) {
            // Sync on load and mark online immediately
            syncUser({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                name: user.fullName || user.firstName || "Unknown",
                imageUrl: user.imageUrl,
            });
            updatePresence({ clerkId: user.id, isOnline: true });

            // Presence heartbeat every 10s for near-real-time updates
            const heartbeat = setInterval(() => {
                updatePresence({ clerkId: user.id, isOnline: document.visibilityState === "visible" });
            }, 10000);

            const handleVisibilityChange = () => {
                updatePresence({ clerkId: user.id, isOnline: document.visibilityState === "visible" });
            };

            const handleBeforeUnload = () => {
                updatePresence({ clerkId: user.id, isOnline: false });
            };

            document.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("beforeunload", handleBeforeUnload);

            return () => {
                clearInterval(heartbeat);
                updatePresence({ clerkId: user.id, isOnline: false });
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                window.removeEventListener("beforeunload", handleBeforeUnload);
            };
        }
    }, [user, isLoaded, syncUser, updatePresence]);

    return null;
}
