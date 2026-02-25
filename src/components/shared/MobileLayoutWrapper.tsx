"use client";

import { usePathname } from "next/navigation";

export default function MobileLayoutWrapper({
    children,
    sidebar,
}: {
    children: React.ReactNode;
    sidebar: React.ReactNode;
}) {
    const pathname = usePathname();
    const isChatRoute = pathname !== "/";

    return (
        <>
            {/* Sidebar Container */}
            <div
                className={`
                    flex flex-col h-full shrink-0 border-r border-white/10 relative z-20 md:w-80 w-full
                    ${isChatRoute ? "hidden md:flex" : "flex"}
                `}
            >
                {sidebar}
            </div>

            {/* Main Content Container (Chat Area) */}
            <div
                className={`
                    flex-1 flex-col min-w-0 relative z-10 w-full md:w-auto h-full
                    ${isChatRoute ? "flex w-full" : "hidden md:flex"}
                `}
            >
                {/* Header (Always visible on desktop, hidden on mobile sidebar) */}
                <header className="h-16 border-b border-white/10 flex items-center px-6 shrink-0 bg-zinc-900/50 backdrop-blur-md">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">PulseChat</h1>
                </header>

                {children}
            </div>
        </>
    );
}
