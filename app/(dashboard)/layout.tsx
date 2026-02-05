import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { MobileMenu } from '@/components/mobile-menu';
import { getProfile } from '@/lib/storage/forms';
import { getSubscriptionStatus } from '@/lib/storage/subscription';
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  const subStatus = await getSubscriptionStatus();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Menu - Shows hamburger on mobile */}
      <MobileMenu profile={profile} />

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex flex-col h-full z-20">
        <DashboardSidebar profile={profile} />
      </aside>

      {/* Main Content Area - Add top padding on mobile for fixed header */}
      <main className="flex-1 overflow-y-auto h-full relative scroll-smooth pt-16 md:pt-0">
        {/* Subscription Warning Banner */}
        <SubscriptionBanner
          status={subStatus.status}
          daysRemaining={subStatus.daysRemaining}
          graceDaysRemaining={subStatus.graceDaysRemaining}
        />
        {children}
      </main>
    </div>
  );
}
