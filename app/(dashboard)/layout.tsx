import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getProfile } from "@/lib/storage";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getProfile();

    // If no profile (not logged in), usually middleware handles this, 
    // but safe to check or handle gracefully.

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar - Hidden on mobile for now (future enhancement: Sheet) */}
            <aside className="hidden md:flex flex-col h-full border-r bg-white w-64 flex-shrink-0 z-20">
                <DashboardSidebar profile={profile} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto h-full relative scroll-smooth">
                {children}
            </main>
        </div>
    );
}
