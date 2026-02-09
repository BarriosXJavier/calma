'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/actions/user';

export async function submitFeedback(content: string) {
  try {
    const { userId } = await auth();
    
    const supabase = await createClient();
    
    let userInternalId: string | null = null;
    
    if (userId) {
      const result = await getOrCreateUser();
      if (!result.success || !result.user) {
        return { success: false, error: result.error || 'User not found' };
      }
      userInternalId = result.user.id;
    }

    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userInternalId,
        content,
        archived: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/feedback');
    return { success: true, feedback };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}

export async function getFeedback() {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Not authenticated' };
    }
    if (!result.user.is_admin) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: feedback, error } = await supabase
      .from('feedback')
      .select(`
        *,
        users (name, email)
      `)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true, feedback };
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return { success: false, error: 'Failed to fetch feedback' };
  }
}

export async function archiveFeedback(feedbackId: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Not authenticated' };
    }
    if (!result.user.is_admin) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('feedback')
      .update({ archived: true })
      .eq('id', feedbackId);

    if (error) {
      console.error('Error archiving feedback:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/feedback');
    return { success: true };
  } catch (error) {
    console.error('Failed to archive feedback:', error);
    return { success: false, error: 'Failed to archive feedback' };
  }
}
