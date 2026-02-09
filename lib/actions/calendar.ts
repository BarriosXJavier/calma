'use server';

import { createClient } from '@/lib/supabase/server';
import { getCalendarEvents } from '@/lib/google/calendar';
import { getOrCreateUser } from '@/lib/actions/user';

export async function getConnectedAccounts() {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('id, email, is_default, created_at')
      .eq('user_id', result.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connected accounts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, accounts };
  } catch (error) {
    console.error('Failed to fetch connected accounts:', error);
    return { success: false, error: 'Failed to fetch connected accounts' };
  }
}

export async function setDefaultAccount(accountId: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    // Reset all accounts to non-default
    await supabase
      .from('connected_accounts')
      .update({ is_default: false })
      .eq('user_id', result.user.id);

    // Set the selected account as default
    const { error } = await supabase
      .from('connected_accounts')
      .update({ is_default: true })
      .eq('id', accountId)
      .eq('user_id', result.user.id);

    if (error) {
      console.error('Error setting default account:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to set default account:', error);
    return { success: false, error: 'Failed to set default account' };
  }
}

export async function disconnectAccount(accountId: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Not authenticated' };
    }

    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', result.user.id);

    if (error) {
      console.error('Error disconnecting account:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect account:', error);
    return { success: false, error: 'Failed to disconnect account' };
  }
}

export async function syncCalendarEvents(
  accountId: string,
  timeMin: string,
  timeMax: string
) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Not authenticated' };
    }

    const { data: account } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', result.user.id)
      .single();

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const events = await getCalendarEvents(
      account.access_token,
      account.refresh_token,
      timeMin,
      timeMax
    );

    return { success: true, events };
  } catch (error) {
    console.error('Failed to sync calendar events:', error);
    return { success: false, error: 'Failed to sync calendar events' };
  }
}
