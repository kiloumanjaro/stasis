import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { UserGreeting } from '@/components/dashboard/UserGreeting';
import { getDashboardGreetingData } from '@/lib/dashboard';

export default async function DashboardPage() {
  const { displayName, dailyStats } = await getDashboardGreetingData();

  return (
    <div className="space-y-6 sm:space-y-8">
      <UserGreeting displayName={displayName} dailyStats={dailyStats} />
      <DashboardContent />
    </div>
  );
}
