import { createClient } from '@/lib/supabase/server';

export interface Profile {
  id: string;
  fullname: string | null;
  email: string | null;
  pictureUrl: string | null;
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

  return {
    id: data.id,
    fullname: data.full_name,
    email: data.email,
    pictureUrl: data.avatar_url,
  };
}

export async function createProfile(
  userId: string,
  userData: {
    fullname?: string;
    email?: string;
    pictureUrl?: string;
  }
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: userData.fullname,
      email: userData.email,
      avatar_url: userData.pictureUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return {
    id: data.id,
    fullname: data.full_name,
    email: data.email,
    pictureUrl: data.avatar_url,
  };
}

export async function upsertProfile(
  userId: string,
  userData: {
    fullname?: string;
    email?: string;
    pictureUrl?: string;
  }
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: userData.fullname,
      email: userData.email,
      avatar_url: userData.pictureUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    return null;
  }

  return {
    id: data.id,
    fullname: data.full_name,
    email: data.email,
    pictureUrl: data.avatar_url,
  };
}
