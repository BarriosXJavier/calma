'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createGoogleCalendarEvent, deleteCalendarEvent } from '@/lib/google/calendar';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/supabase/types';
import { startOfMonth } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/actions/user';

export async function createBooking(data: {
  hostId: string;
  meetingTypeId: string;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  guestTimezone: string;
  notes?: string;
}) {
  try {
    const supabase = createServiceClient();
    
    // Get host info
    const { data: host } = await supabase
      .from('users')
      .select('subscription_tier, timezone, name')
      .eq('id', data.hostId)
      .single();

    if (!host) {
      return { success: false, error: 'Host not found' };
    }

    // Check booking quota
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', data.hostId)
      .gte('created_at', startOfCurrentMonth);

    const tier = host.subscription_tier as SubscriptionTier;
    const limit = TIER_LIMITS[tier].bookingsPerMonth;
    if (count !== null && count >= limit) {
      return { success: false, error: 'Booking limit reached for this month' };
    }

    // Get meeting type info
    const { data: meetingType } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('id', data.meetingTypeId)
      .single();

    if (!meetingType) {
      return { success: false, error: 'Meeting type not found' };
    }

    // Get host's default connected calendar account
    let googleEventId: string | null = null;
    let meetLink: string | null = null;

    const { data: connectedAccount } = await supabase
      .from('connected_accounts')
      .select('access_token, refresh_token')
      .eq('user_id', data.hostId)
      .eq('is_default', true)
      .single();

    // If host has a connected calendar, create the event
    if (connectedAccount) {
      try {
        const calendarEvent = await createGoogleCalendarEvent(
          connectedAccount.access_token,
          connectedAccount.refresh_token,
          {
            summary: `${meetingType.name} with ${data.guestName}`,
            description: data.notes || meetingType.description || undefined,
            startTime: data.startTime,
            endTime: data.endTime,
            timeZone: host.timezone,
            attendees: [{ email: data.guestEmail }],
          }
        );
        googleEventId = calendarEvent.eventId || null;
        meetLink = calendarEvent.meetLink;
      } catch (calendarError) {
        // Log but don't fail the booking if calendar event creation fails
        console.error('Failed to create calendar event:', calendarError);
        // Continue with booking creation without calendar event
      }
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        host_id: data.hostId,
        meeting_type_id: data.meetingTypeId,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        start_time: data.startTime,
        end_time: data.endTime,
        guest_timezone: data.guestTimezone,
        notes: data.notes,
        status: 'confirmed' as const,
        google_event_id: googleEventId,
        meet_link: meetLink,
      })
      .select()
      .single();

    if (error) {
      console.error('Booking creation error:', error);
      return { success: false, error: error.message };
    }

    // TODO: Send confirmation emails
    
    revalidatePath('/bookings');
    return { success: true, booking, meetLink };
  } catch (error) {
    console.error('Failed to create booking:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}

export async function getBookings() {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        meeting_types (*)
      `)
      .eq('host_id', result.user.id)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, bookings };
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return { success: false, error: 'Failed to fetch bookings' };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }
    const user = result.user;

    // Get the booking to check ownership and get calendar event info
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, host_id, google_event_id')
      .eq('id', bookingId)
      .eq('host_id', user.id)
      .single();

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Cancel Google Calendar event if it exists
    if (booking.google_event_id) {
      const { data: connectedAccount } = await supabase
        .from('connected_accounts')
        .select('access_token, refresh_token')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (connectedAccount) {
        try {
          await deleteCalendarEvent(
            connectedAccount.access_token,
            connectedAccount.refresh_token,
            booking.google_event_id
          );
        } catch (calendarError) {
          // Log but don't fail the cancellation if calendar event deletion fails
          console.error('Failed to delete calendar event:', calendarError);
        }
      }
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' as const })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/bookings');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    return { success: false, error: 'Failed to cancel booking' };
  }
}
