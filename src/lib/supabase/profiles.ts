import { createClient } from '@/lib/supabase/server';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createProfile(
  userId: string,
  userData: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  }
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: userData.full_name,
      email: userData.email,
      avatar_url: userData.avatar_url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return data;
}

export async function upsertProfile(
  userId: string,
  userData: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  }
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: userData.full_name,
      email: userData.email,
      avatar_url: userData.avatar_url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    return null;
  }

  return data;
}
