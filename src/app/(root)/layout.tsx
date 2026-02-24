import { UserButton } from "@clerk/nextjs";
import UserSync from "@/components/shared/UserSync";
import Sidebar from "@/components/sidebar/Sidebar";
import AuthProtectedRoute from "@/components/providers/AuthProtectedRoute";

export default function RootAppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProtectedRoute>
            <div className="flex h-screen bg-zinc-950 text-slate-100 overflow-hidden relative">
                <UserSync />
                <div className="hidden md:flex flex-col h-full shrink-0 border-r border-white/10 relative z-20 md:w-80 w-full group-[.chat-active]:hidden">
                    <Sidebar />
                </div>
                <main className="flex-1 flex flex-col min-w-0 relative z-10 w-full md:w-auto h-full">
                    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-zinc-900/50 backdrop-blur-md">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">PulseChat</h1>
                        <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
                    </header>
                    {children}
                </main>
            </div>
        </AuthProtectedRoute>
    );
}
