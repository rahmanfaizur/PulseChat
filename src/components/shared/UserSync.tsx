"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);

    useEffect(() => {
        if (isLoaded && user) {
            syncUser({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                name: user.fullName || user.firstName || "Unknown",
                imageUrl: user.imageUrl,
            });
        }
    }, [user, isLoaded, syncUser]);

    return null;
}
