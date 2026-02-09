'use server';

import { startOfMonth } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/actions/user';
import {
  createGoogleCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from '@/lib/google/calendar';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { type SubscriptionTier, TIER_LIMITS } from '@/lib/supabase/types';

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
          },
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
            booking.google_event_id,
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

export async function getBookingById(bookingId: string) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        meeting_types (*)
      `)
      .eq('id', bookingId)
      .eq('host_id', result.user.id)
      .single();

    if (error || !booking) {
      return { success: false, error: 'Booking not found' };
    }

    return { success: true, booking };
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    return { success: false, error: 'Failed to fetch booking' };
  }
}

export async function rescheduleBooking(
  bookingId: string,
  newStartTime: string,
  newEndTime: string,
) {
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
      .select('*, meeting_types(name)')
      .eq('id', bookingId)
      .eq('host_id', user.id)
      .single();

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.status === 'cancelled') {
      return { success: false, error: 'Cannot reschedule a cancelled booking' };
    }

    // Update Google Calendar event if it exists
    if (booking.google_event_id) {
      const { data: connectedAccount } = await supabase
        .from('connected_accounts')
        .select('access_token, refresh_token')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (connectedAccount) {
        try {
          await updateCalendarEvent(
            connectedAccount.access_token,
            connectedAccount.refresh_token,
            booking.google_event_id,
            {
              startTime: newStartTime,
              endTime: newEndTime,
              timeZone: user.timezone,
            },
          );
        } catch (calendarError) {
          // Log but don't fail the reschedule if calendar event update fails
          console.error('Failed to update calendar event:', calendarError);
        }
      }
    }

    // Update the booking in the database
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
      })
      .eq('id', bookingId)
      .select(`
        *,
        meeting_types (*)
      `)
      .single();

    if (error) {
      console.error('Error rescheduling booking:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/bookings');
    return { success: true, booking: updatedBooking };
  } catch (error) {
    console.error('Failed to reschedule booking:', error);
    return { success: false, error: 'Failed to reschedule booking' };
  }
}

export async function getAvailableSlotsForReschedule(
  bookingId: string,
  dateStr: string,
) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }
    const user = result.user;

    // Get the booking to get meeting type duration
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, meeting_types(duration_minutes)')
      .eq('id', bookingId)
      .eq('host_id', user.id)
      .single();

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const durationMinutes = booking.meeting_types?.duration_minutes || 30;
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get user's availability for this day
    const { data: availability } = await supabase
      .from('availability')
      .select('start_time, end_time')
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek);

    if (!availability || availability.length === 0) {
      return { success: true, slots: [] };
    }

    // Get existing bookings for this date (excluding the current booking being rescheduled)
    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('host_id', user.id)
      .eq('status', 'confirmed')
      .neq('id', bookingId) // Exclude the booking being rescheduled
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    // Generate all possible slots from availability blocks
    const { generateTimeSlots, isTimeSlotAvailable } = await import(
      '@/lib/booking-utils'
    );
    const { addMinutes, format } = await import('date-fns');

    const allSlots: string[] = [];
    for (const block of availability) {
      const slots = generateTimeSlots(
        block.start_time,
        block.end_time,
        durationMinutes,
      );
      allSlots.push(...slots);
    }

    // Filter out booked slots
    const availableSlots = allSlots.filter((slot) => {
      // Check if slot is available (not overlapping with existing bookings)
      if (!isTimeSlotAvailable(slot, existingBookings || [], date)) {
        return false;
      }

      // Check if slot end time is within availability block
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = addMinutes(slotStart, durationMinutes);

      // Check if the full duration fits within any availability block
      const slotEndTime = format(slotEnd, 'HH:mm');
      const fitsInBlock = availability.some((block) => {
        return (
          slot >= block.start_time.slice(0, 5) &&
          slotEndTime <= block.end_time.slice(0, 5)
        );
      });

      if (!fitsInBlock) {
        return false;
      }

      // Check minimum notice (1 hour ahead)
      const now = new Date();
      const minNoticeTime = addMinutes(now, 60);
      if (slotStart < minNoticeTime) {
        return false;
      }

      return true;
    });

    // Remove duplicates and sort
    const uniqueSlots = [...new Set(availableSlots)].sort();

    return { success: true, slots: uniqueSlots, durationMinutes };
  } catch (error) {
    console.error('Failed to get available slots:', error);
    return { success: false, error: 'Failed to get available slots' };
  }
}

export async function getAvailableSlotsForCreate(
  meetingTypeId: string,
  dateStr: string,
) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }
    const user = result.user;

    // Get the meeting type to get duration
    const { data: meetingType } = await supabase
      .from('meeting_types')
      .select('duration_minutes')
      .eq('id', meetingTypeId)
      .eq('user_id', user.id)
      .single();

    if (!meetingType) {
      return { success: false, error: 'Meeting type not found' };
    }

    const durationMinutes = meetingType.duration_minutes;
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get user's availability for this day
    const { data: availability } = await supabase
      .from('availability')
      .select('start_time, end_time')
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek);

    if (!availability || availability.length === 0) {
      return { success: true, slots: [], durationMinutes };
    }

    // Get existing bookings for this date
    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('host_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    // Generate all possible slots from availability blocks
    const { generateTimeSlots, isTimeSlotAvailable } = await import(
      '@/lib/booking-utils'
    );
    const { addMinutes, format } = await import('date-fns');

    const allSlots: string[] = [];
    for (const block of availability) {
      const slots = generateTimeSlots(
        block.start_time,
        block.end_time,
        durationMinutes,
      );
      allSlots.push(...slots);
    }

    // Filter out booked slots
    const availableSlots = allSlots.filter((slot) => {
      // Check if slot is available (not overlapping with existing bookings)
      if (!isTimeSlotAvailable(slot, existingBookings || [], date)) {
        return false;
      }

      // Check if slot end time is within availability block
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = addMinutes(slotStart, durationMinutes);

      // Check if the full duration fits within any availability block
      const slotEndTime = format(slotEnd, 'HH:mm');
      const fitsInBlock = availability.some((block) => {
        return (
          slot >= block.start_time.slice(0, 5) &&
          slotEndTime <= block.end_time.slice(0, 5)
        );
      });

      if (!fitsInBlock) {
        return false;
      }

      // Check minimum notice (1 hour ahead)
      const now = new Date();
      const minNoticeTime = addMinutes(now, 60);
      if (slotStart < minNoticeTime) {
        return false;
      }

      return true;
    });

    // Remove duplicates and sort
    const uniqueSlots = [...new Set(availableSlots)].sort();

    return { success: true, slots: uniqueSlots, durationMinutes };
  } catch (error) {
    console.error('Failed to get available slots:', error);
    return { success: false, error: 'Failed to get available slots' };
  }
}

export async function createBookingAsHost(data: {
  meetingTypeId: string;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  notes?: string;
}) {
  try {
    const supabase = await createClient();
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'User not found' };
    }
    const user = result.user;

    // Check booking quota
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .gte('created_at', startOfCurrentMonth);

    const tier = user.subscription_tier as SubscriptionTier;
    const limit = TIER_LIMITS[tier].bookingsPerMonth;
    if (count !== null && count >= limit) {
      return { success: false, error: 'Booking limit reached for this month' };
    }

    // Get meeting type info
    const { data: meetingType } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('id', data.meetingTypeId)
      .eq('user_id', user.id)
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
      .eq('user_id', user.id)
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
            timeZone: user.timezone,
            attendees: [{ email: data.guestEmail }],
          },
        );
        googleEventId = calendarEvent.eventId || null;
        meetLink = calendarEvent.meetLink;
      } catch (calendarError) {
        // Log but don't fail the booking if calendar event creation fails
        console.error('Failed to create calendar event:', calendarError);
      }
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        host_id: user.id,
        meeting_type_id: data.meetingTypeId,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        start_time: data.startTime,
        end_time: data.endTime,
        guest_timezone: user.timezone, // Use host's timezone for host-created bookings
        notes: data.notes,
        status: 'confirmed' as const,
        google_event_id: googleEventId,
        meet_link: meetLink,
      })
      .select(`
        *,
        meeting_types (*)
      `)
      .single();

    if (error) {
      console.error('Booking creation error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/bookings');
    return { success: true, booking, meetLink };
  } catch (error) {
    console.error('Failed to create booking:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}
