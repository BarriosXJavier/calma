'use server';

import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';
import { generateTimeSlots, isTimeSlotAvailable } from '@/lib/booking-utils';
import { createServiceClient } from '@/lib/supabase/server';

// Booking constraints
const MIN_NOTICE_HOURS = 1;
const MAX_ADVANCE_DAYS = 30;

export async function getHostBySlug(slug: string) {
  try {
    const supabase = createServiceClient();

    const { data: host, error } = await supabase
      .from('users')
      .select('id, name, slug, timezone')
      .eq('slug', slug)
      .single();

    if (error || !host) {
      return { success: false, error: 'Host not found' };
    }

    return { success: true, host };
  } catch (error) {
    console.error('Failed to fetch host:', error);
    return { success: false, error: 'Failed to fetch host' };
  }
}

export async function getHostMeetingTypes(hostId: string) {
  try {
    const supabase = createServiceClient();

    const { data: meetingTypes, error } = await supabase
      .from('meeting_types')
      .select('id, name, slug, duration_minutes, description')
      .eq('user_id', hostId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, meetingTypes: meetingTypes || [] };
  } catch (error) {
    console.error('Failed to fetch meeting types:', error);
    return { success: false, error: 'Failed to fetch meeting types' };
  }
}

export async function getMeetingTypeBySlug(
  hostId: string,
  meetingTypeSlug: string,
) {
  try {
    const supabase = createServiceClient();

    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .select('id, name, slug, duration_minutes, description')
      .eq('user_id', hostId)
      .eq('slug', meetingTypeSlug)
      .eq('is_active', true)
      .single();

    if (error || !meetingType) {
      return { success: false, error: 'Meeting type not found' };
    }

    return { success: true, meetingType };
  } catch (error) {
    console.error('Failed to fetch meeting type:', error);
    return { success: false, error: 'Failed to fetch meeting type' };
  }
}

export async function getHostAvailability(hostId: string) {
  try {
    const supabase = createServiceClient();

    const { data: availability, error } = await supabase
      .from('availability')
      .select('day_of_week, start_time, end_time')
      .eq('user_id', hostId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, availability: availability || [] };
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return { success: false, error: 'Failed to fetch availability' };
  }
}

export async function getAvailableDates(hostId: string) {
  try {
    const availabilityResult = await getHostAvailability(hostId);
    if (!availabilityResult.success || !availabilityResult.availability) {
      return { success: false, error: 'Failed to fetch availability' };
    }

    // Get unique days of week that have availability
    const availableDaysOfWeek = [
      ...new Set(availabilityResult.availability.map((a) => a.day_of_week)),
    ];

    // Generate dates for the next MAX_ADVANCE_DAYS days
    const today = startOfDay(new Date());
    const availableDates: string[] = [];

    for (let i = 0; i < MAX_ADVANCE_DAYS; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();

      if (availableDaysOfWeek.includes(dayOfWeek)) {
        availableDates.push(format(date, 'yyyy-MM-dd'));
      }
    }

    return { success: true, availableDates, availableDaysOfWeek };
  } catch (error) {
    console.error('Failed to get available dates:', error);
    return { success: false, error: 'Failed to get available dates' };
  }
}

export async function getAvailableSlots(
  hostId: string,
  meetingTypeId: string,
  dateStr: string,
  guestTimezone: string,
) {
  try {
    const supabase = createServiceClient();

    // Get meeting type for duration
    const { data: meetingType } = await supabase
      .from('meeting_types')
      .select('duration_minutes')
      .eq('id', meetingTypeId)
      .single();

    if (!meetingType) {
      return { success: false, error: 'Meeting type not found' };
    }

    const durationMinutes = meetingType.duration_minutes;
    const date = parseISO(dateStr);
    const dayOfWeek = date.getDay();

    // Get host's availability for this day of week
    const { data: availability } = await supabase
      .from('availability')
      .select('start_time, end_time')
      .eq('user_id', hostId)
      .eq('day_of_week', dayOfWeek);

    if (!availability || availability.length === 0) {
      return { success: true, slots: [] };
    }

    // Get existing bookings for this date
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('host_id', hostId)
      .eq('status', 'confirmed')
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd);

    // Generate all possible slots from availability blocks
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
      const minNoticeTime = addMinutes(now, MIN_NOTICE_HOURS * 60);
      if (slotStart < minNoticeTime) {
        return false;
      }

      return true;
    });

    // Remove duplicates and sort
    const uniqueSlots = [...new Set(availableSlots)].sort();

    return { success: true, slots: uniqueSlots };
  } catch (error) {
    console.error('Failed to get available slots:', error);
    return { success: false, error: 'Failed to get available slots' };
  }
}

export async function getBookingDetails(bookingId: string) {
  try {
    const supabase = createServiceClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        meeting_types (name, duration_minutes),
        users:host_id (name, timezone)
      `)
      .eq('id', bookingId)
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
