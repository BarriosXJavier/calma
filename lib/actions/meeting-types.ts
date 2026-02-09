'use server';

import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/actions/user';
import { createClient } from '@/lib/supabase/server';

export async function getMeetingTypes() {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const { data: meetingTypes, error } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('user_id', result.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching meeting types:', error);
      return { success: false, error: error.message };
    }

    return { success: true, meetingTypes: meetingTypes || [] };
  } catch (error) {
    console.error('Failed to fetch meeting types:', error);
    return { success: false, error: 'Failed to fetch meeting types' };
  }
}

export async function createMeetingType(data: {
  name: string;
  slug: string;
  durationMinutes: number;
  description?: string;
}) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    // Check if slug is already used by this user
    const { data: existing } = await supabase
      .from('meeting_types')
      .select('id')
      .eq('user_id', result.user.id)
      .eq('slug', data.slug)
      .single();

    if (existing) {
      return {
        success: false,
        error: 'A meeting type with this URL already exists',
      };
    }

    // Check if this is the first meeting type (make it default)
    const { count } = await supabase
      .from('meeting_types')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', result.user.id);

    const isFirst = count === 0;

    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .insert({
        user_id: result.user.id,
        name: data.name,
        slug: data.slug,
        duration_minutes: data.durationMinutes,
        description: data.description || null,
        is_default: isFirst,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting type:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/meeting-types');
    return { success: true, meetingType };
  } catch (error) {
    console.error('Failed to create meeting type:', error);
    return { success: false, error: 'Failed to create meeting type' };
  }
}

export async function updateMeetingType(
  id: string,
  data: {
    name?: string;
    slug?: string;
    durationMinutes?: number;
    description?: string;
    isActive?: boolean;
  },
) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    // If updating slug, check for duplicates
    if (data.slug) {
      const { data: existing } = await supabase
        .from('meeting_types')
        .select('id')
        .eq('user_id', result.user.id)
        .eq('slug', data.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'A meeting type with this URL already exists',
        };
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.durationMinutes !== undefined)
      updateData.duration_minutes = data.durationMinutes;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', result.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting type:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/meeting-types');
    return { success: true, meetingType };
  } catch (error) {
    console.error('Failed to update meeting type:', error);
    return { success: false, error: 'Failed to update meeting type' };
  }
}

export async function deleteMeetingType(id: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    // Check if there are any confirmed bookings for this meeting type
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('meeting_type_id', id)
      .eq('status', 'confirmed');

    if (bookingCount && bookingCount > 0) {
      return {
        success: false,
        error:
          'Cannot delete: there are confirmed bookings for this meeting type',
      };
    }

    const { error } = await supabase
      .from('meeting_types')
      .delete()
      .eq('id', id)
      .eq('user_id', result.user.id);

    if (error) {
      console.error('Error deleting meeting type:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/meeting-types');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete meeting type:', error);
    return { success: false, error: 'Failed to delete meeting type' };
  }
}

export async function setDefaultMeetingType(id: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    // Remove default from all meeting types for this user
    await supabase
      .from('meeting_types')
      .update({ is_default: false })
      .eq('user_id', result.user.id);

    // Set new default
    const { error } = await supabase
      .from('meeting_types')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', result.user.id);

    if (error) {
      console.error('Error setting default meeting type:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/meeting-types');
    return { success: true };
  } catch (error) {
    console.error('Failed to set default meeting type:', error);
    return { success: false, error: 'Failed to set default meeting type' };
  }
}

// Helper to generate a URL-friendly slug from a name
export async function generateSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
