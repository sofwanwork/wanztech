import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { MobileMenu } from '@/components/mobile-menu';
import { getProfile } from '@/lib/storage/forms';
import { getSubscriptionStatus } from '@/lib/storage/subscription';
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  const subStatus = await getSubscriptionStatus();

  return (
    <DashboardShell
      sidebar={<DashboardSidebar profile={profile} />}
      mobileMenu={<MobileMenu profile={profile} />}
      banner={
        <SubscriptionBanner
          status={subStatus.status}
          daysRemaining={subStatus.daysRemaining}
          graceDaysRemaining={subStatus.graceDaysRemaining}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
