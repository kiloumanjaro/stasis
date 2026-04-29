'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { getBackendUser, type BackendAuthUser } from '@/lib/backend-auth';

export default function ProfilePage() {
  const [user, setUser] = useState<BackendAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserAndProfile() {
      const user = await getBackendUser();
      setUser(user);

      setLoading(false);
    }

    void loadUserAndProfile();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your backend-authenticated account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.pictureUrl && (
            <Image
              src={user.pictureUrl}
              alt="Profile"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full"
            />
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Full Name
            </label>
            <p className="text-lg">{user.name || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-lg">{user.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              User ID
            </label>
            <p className="font-mono text-sm">{user.id}</p>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Raw user metadata (for debugging)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
