"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    return (
        <>
            <Authenticated>
                {children}
            </Authenticated>
            <Unauthenticated>
                <RedirectToSignIn router={router} />
            </Unauthenticated>
        </>
    );
}

function RedirectToSignIn({ router }: { router: any }) {
    useEffect(() => {
        router.push("/sign-in");
    }, [router]);

    return null;
}
