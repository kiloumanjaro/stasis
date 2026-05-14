import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { UserGreeting } from '@/components/dashboard/UserGreeting';
import { getDashboardGreetingData } from '@/lib/dashboard';

export default async function DashboardPage() {
  const { displayName, pictureUrl, dailyStats } =
    await getDashboardGreetingData();

  return (
    <div className="space-y-6 sm:space-y-8">
      <UserGreeting
        displayName={displayName}
        pictureUrl={pictureUrl}
        dailyStats={dailyStats}
      />
      <DashboardContent />
      <DashboardFooter />
    </div>
  );
}
