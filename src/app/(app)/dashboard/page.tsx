import { Suspense } from 'react';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Footer } from '@/components/dashboard/Footer';
import { UserGreeting } from '@/components/dashboard/UserGreeting';
import { getDashboardGreetingData } from '@/lib/dashboard';

async function DashboardGreetingSection() {
  const { displayName, pictureUrl, dailyStats } =
    await getDashboardGreetingData();

  return (
    <UserGreeting
      displayName={displayName}
      pictureUrl={pictureUrl}
      dailyStats={dailyStats}
    />
  );
}

function DashboardGreetingFallback() {
  return (
    <section className="flex min-h-[72px] flex-col justify-center gap-3 px-1 py-2 sm:min-h-[88px] sm:px-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="h-9 w-48 animate-pulse rounded-md bg-white/10 sm:h-10 sm:w-56" />
        <div className="h-11 w-11 animate-pulse rounded-full bg-white/10 sm:h-12 sm:w-12" />
      </div>
      <div className="h-5 w-72 animate-pulse rounded-md bg-white/10 sm:w-96" />
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Suspense fallback={<DashboardGreetingFallback />}>
        <DashboardGreetingSection />
      </Suspense>
      <DashboardContent />
      <Footer />
    </div>
  );
}
