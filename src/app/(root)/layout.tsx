import UserSync from "@/components/shared/UserSync";
import Sidebar from "@/components/sidebar/Sidebar";
import AuthProtectedRoute from "@/components/providers/AuthProtectedRoute";
import MobileLayoutWrapper from "@/components/shared/MobileLayoutWrapper";

export default function RootAppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProtectedRoute>
            <div className="flex h-screen bg-zinc-950 text-slate-100 overflow-hidden relative">
                <UserSync />
                <MobileLayoutWrapper sidebar={<Sidebar />}>
                    <main className="flex-1 flex flex-col min-w-0 relative z-10 w-full md:w-auto h-full">
                        {children}
                    </main>
                </MobileLayoutWrapper>
            </div>
        </AuthProtectedRoute>
    );
}
