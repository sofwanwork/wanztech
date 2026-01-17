import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileMenu } from "@/components/mobile-menu";
import { getProfile } from "@/lib/storage";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getProfile();

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Menu - Shows hamburger on mobile */}
            <MobileMenu profile={profile} />

            {/* Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex flex-col h-full border-r bg-white w-64 flex-shrink-0 z-20">
                <DashboardSidebar profile={profile} />
            </aside>

            {/* Main Content Area - Add top padding on mobile for fixed header */}
            <main className="flex-1 overflow-y-auto h-full relative scroll-smooth pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
}
