'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { TIER_LIMITS } from '@/lib/supabase/types';
import { startOfMonth } from 'date-fns';

export async function getCurrentUser() {
  try {
    const result = await getOrCreateUser();
    if (!result.success) {
      return result;
    }

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

export async function updateUserProfile(data: {
  name?: string;
  slug?: string;
  timezone?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createServiceClient();

    // If slug is being updated, check availability
    if (data.slug) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('slug', data.slug)
        .neq('clerk_id', userId)
        .single();

      if (existingUser) {
        return { success: false, error: 'This URL is already taken' };
      }
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
      })
      .eq('clerk_id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function checkSlugAvailability(slug: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createServiceClient();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('slug', slug)
      .neq('clerk_id', userId)
      .single();

    return { 
      success: true, 
      available: !existingUser 
    };
  } catch (error) {
    console.error('Failed to check slug availability:', error);
    return { success: false, error: 'Failed to check availability' };
  }
}

export async function getUserUsageStats() {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const user = result.user;

    // Count connected calendars
    const { count: calendarCount } = await supabase
      .from('connected_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count bookings this month
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .gte('created_at', startOfCurrentMonth);

    const tier = user.subscription_tier as keyof typeof TIER_LIMITS;
    const limits = TIER_LIMITS[tier];

    return {
      success: true,
      stats: {
        tier: user.subscription_tier,
        calendars: {
          used: calendarCount || 0,
          limit: limits.calendars,
        },
        bookings: {
          used: bookingCount || 0,
          limit: limits.bookingsPerMonth,
        },
      },
    };
  } catch (error) {
    console.error('Failed to fetch usage stats:', error);
    return { success: false, error: 'Failed to fetch usage stats' };
  }
}

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = createServiceClient();

  const { data: existingUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (existingUser) {
    return { success: true, user: existingUser };
  }

  const isNotFound = error?.code === 'PGRST116';
  if (error && !isNotFound) {
    console.error('Error fetching user:', error);
    return { success: false, error: error.message || 'Failed to fetch user' };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`
    .trim() || 'user';
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const slug = `${baseSlug}-${userId.slice(-6)}`;

  const serviceClient = createServiceClient();
  const { error: insertError } = await serviceClient
    .from('users')
    .insert({
      clerk_id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name,
      slug,
    });

  if (insertError) {
    console.error('Failed to create user in Supabase:', insertError);
    return { success: false, error: 'Failed to create user' };
  }

  const { data: createdUser, error: fetchError } = await serviceClient
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (fetchError || !createdUser) {
    console.error('Failed to fetch created user:', fetchError);
    return { success: false, error: 'Failed to fetch user' };
  }

  return { success: true, user: createdUser };
}
