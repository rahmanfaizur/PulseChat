"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoaded, userId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push("/sign-in");
        }
    }, [isLoaded, userId, router]);

    if (!isLoaded) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-indigo-500">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!userId) {
        return null;
    }

    return <>{children}</>;
}
