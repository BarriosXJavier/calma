'use client';

import type { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, {
  type DateClickArg,
} from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import type { BookingWithMeetingType } from '@/lib/supabase/types';

interface BookingsCalendarProps {
  bookings: BookingWithMeetingType[];
  onEventClick: (bookingId: string) => void;
  onDateClick: (date: Date) => void;
}

export function BookingsCalendar({
  bookings,
  onEventClick,
  onDateClick,
}: BookingsCalendarProps) {
  // Transform bookings to FullCalendar events
  const events = bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.guest_name} - ${booking.meeting_types?.name || 'Meeting'}`,
    start: booking.start_time,
    end: booking.end_time,
    backgroundColor: booking.status === 'cancelled' ? '#94a3b8' : '#3b82f6',
    borderColor: booking.status === 'cancelled' ? '#64748b' : '#2563eb',
    textColor: '#ffffff',
    extendedProps: {
      status: booking.status,
      guestEmail: booking.guest_email,
      meetLink: booking.meet_link,
    },
  }));

  const handleEventClick = (info: EventClickArg) => {
    onEventClick(info.event.id);
  };

  const handleDateClick = (info: DateClickArg) => {
    onDateClick(info.date);
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkClick="popover"
        selectable={true}
        eventClassNames={(arg) => {
          const classes = ['cursor-pointer', 'text-sm', 'px-1'];
          if (arg.event.extendedProps.status === 'cancelled') {
            classes.push('line-through', 'opacity-60');
          }
          return classes;
        }}
        dayCellClassNames="cursor-pointer hover:bg-muted/50 transition-colors"
      />
    </div>
  );
}
