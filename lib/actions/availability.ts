'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/actions/user';

export async function getAvailability() {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', result.user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching availability:', error);
      return { success: false, error: error.message };
    }

    return { success: true, availability };
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return { success: false, error: 'Failed to fetch availability' };
  }
}

export async function addAvailabilityBlock(data: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const { data: availability, error } = await supabase
      .from('availability')
      .insert({
        user_id: result.user.id,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding availability:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/availability');
    return { success: true, availability };
  } catch (error) {
    console.error('Failed to add availability:', error);
    return { success: false, error: 'Failed to add availability' };
  }
}

export async function updateAvailabilityBlock(
  id: string,
  data: {
    startTime?: string;
    endTime?: string;
  }
) {
  try {
    const result = await getOrCreateUser();
    if (!result.success) {
      return { success: false, error: result.error || 'Not authenticated' };
    }
    const supabase = await createClient();

    const { data: availability, error } = await supabase
      .from('availability')
      .update({
        start_time: data.startTime,
        end_time: data.endTime,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating availability:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/availability');
    return { success: true, availability };
  } catch (error) {
    console.error('Failed to update availability:', error);
    return { success: false, error: 'Failed to update availability' };
  }
}

export async function deleteAvailabilityBlock(id: string) {
  try {
    const result = await getOrCreateUser();
    if (!result.success) {
      return { success: false, error: result.error || 'Not authenticated' };
    }
    const supabase = await createClient();

    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting availability:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/availability');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete availability:', error);
    return { success: false, error: 'Failed to delete availability' };
  }
}

export async function copyDayAvailability(
  sourceDay: number,
  targetDays: number[]
) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    // Get source day availability
    const { data: sourceAvailability } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', result.user.id)
      .eq('day_of_week', sourceDay);

    if (!sourceAvailability || sourceAvailability.length === 0) {
      return { success: false, error: 'No availability found for source day' };
    }

    // Delete existing availability for target days
    await supabase
      .from('availability')
      .delete()
      .eq('user_id', result.user.id)
      .in('day_of_week', targetDays);

    // Copy to target days
    const newBlocks = targetDays.flatMap((day) =>
      sourceAvailability.map((block) => ({
        user_id: result.user.id,
        day_of_week: day,
        start_time: block.start_time,
        end_time: block.end_time,
      }))
    );

    const { error } = await supabase.from('availability').insert(newBlocks);

    if (error) {
      console.error('Error copying availability:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/availability');
    return { success: true };
  } catch (error) {
    console.error('Failed to copy availability:', error);
    return { success: false, error: 'Failed to copy availability' };
  }
}
