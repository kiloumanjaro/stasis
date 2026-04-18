'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUserAndProfile() {
      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Try to get profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else if (error && error.code === 'PGRST116') {
          // Profile doesn't exist (not found error), create it from user metadata
          const profileToInsert = {
            id: user.id,
            full_name:
              user.user_metadata.full_name || user.user_metadata.name || null,
            email: user.email,
            avatar_url:
              user.user_metadata.avatar_url ||
              user.user_metadata.picture ||
              null,
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileToInsert)
            .select()
            .single();

          if (newProfile) {
            setProfile(newProfile);
          } else if (createError) {
            console.error('Error creating profile:', createError);
            console.error(
              'Error details:',
              JSON.stringify(createError, null, 2)
            );
          }
        } else if (error) {
          console.error('Unexpected profile error:', error);
        }
      }

      setLoading(false);
    }

    loadUserAndProfile();
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
          <CardDescription>Your Google account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
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
            <p className="text-lg">{profile?.full_name || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-lg">{profile?.email || user.email}</p>
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
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </details>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Profile data (for debugging)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
