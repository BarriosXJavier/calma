'use client';

import { format, parseISO } from 'date-fns';
import { CalendarDays, ExternalLink, List, Plus, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BookingWithMeetingType } from '@/lib/supabase/types';
import { BookingsCalendar } from './bookings-calendar';
import { CreateBookingDialog } from './create-booking-dialog';
import { RescheduleDialog } from './reschedule-dialog';

interface BookingsClientProps {
  initialBookings: BookingWithMeetingType[];
}

export function BookingsClient({ initialBookings }: BookingsClientProps) {
  const router = useRouter();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const selectedBooking =
    initialBookings.find((b) => b.id === selectedBookingId) || null;

  const handleEventClick = useCallback((bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRescheduleDialogOpen(true);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCreateBooking = useCallback(() => {
    setSelectedDate(new Date());
    setCreateDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* View Toggle and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {initialBookings.length} booking
            {initialBookings.length !== 1 ? 's' : ''}
          </p>
          <Button size="sm" onClick={handleCreateBooking}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <BookingsCalendar
          bookings={initialBookings}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {initialBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                <p className="text-muted-foreground">No bookings yet</p>
                <Button variant="outline" onClick={handleCreateBooking}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first booking
                </Button>
              </CardContent>
            </Card>
          ) : (
            initialBookings.map((booking) => {
              const startDate = parseISO(booking.start_time);
              const endDate = parseISO(booking.end_time);
              const isPast = startDate < new Date();

              return (
                <Card
                  key={booking.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    booking.status === 'cancelled' ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleEventClick(booking.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.meeting_types?.name || 'Meeting'}
                        </CardTitle>
                        <CardDescription>
                          with {booking.guest_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPast && booking.status === 'confirmed' && (
                          <Badge variant="outline">Past</Badge>
                        )}
                        <Badge
                          variant={
                            booking.status === 'cancelled'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm">
                        <p className="font-medium">
                          {format(startDate, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-muted-foreground">
                          {format(startDate, 'h:mm a')} -{' '}
                          {format(endDate, 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.meet_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(booking.meet_link!, '_blank');
                            }}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {booking.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <RescheduleDialog
        booking={selectedBooking}
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Create Booking Dialog */}
      <CreateBookingDialog
        selectedDate={selectedDate}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
