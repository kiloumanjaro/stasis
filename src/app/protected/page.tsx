import { redirect } from 'next/navigation';

import { cookies } from 'next/headers';

import { getBackendUser } from '@/lib/backend-auth';
import { InfoIcon } from 'lucide-react';
import { Suspense } from 'react';

async function UserDetails() {
  if (process.env.SKIP_AUTH === 'true') {
    return JSON.stringify(
      {
        id: 'demo-user',
        userId: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        pictureUrl: '',
        note: 'Auth bypassed - mock user data',
      },
      null,
      2
    );
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  const user = await getBackendUser(cookieHeader);

  if (!user) {
    redirect('/auth/sign-up');
  }

  return JSON.stringify(user, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <div className="w-full">
        <div className="flex items-center gap-3 rounded-md bg-accent p-3 px-5 text-sm text-foreground">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Your user details</h2>
        <pre className="max-h-32 overflow-auto rounded border p-3 font-mono text-xs">
          <Suspense>
            <UserDetails />
          </Suspense>
        </pre>
      </div>
    </div>
  );
}
