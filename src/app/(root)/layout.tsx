import { UserButton } from "@clerk/nextjs";
import UserSync from "@/components/shared/UserSync";

export default function RootAppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-zinc-950 text-slate-100 overflow-hidden">
            <UserSync />
            {/* Sidebar will be injected here during Phase 2 */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-zinc-900/50 backdrop-blur-md">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">PulseChat</h1>
                    <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
                </header>
                {children}
            </main>
        </div>
    );
}
