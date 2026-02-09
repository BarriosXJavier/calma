'use client';

import { addMinutes, format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  cancelBooking,
  getAvailableSlotsForReschedule,
  rescheduleBooking,
} from '@/lib/actions/booking';
import type { BookingWithMeetingType } from '@/lib/supabase/types';

interface RescheduleDialogProps {
  booking: BookingWithMeetingType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RescheduleDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleDialogProps) {
  const [step, setStep] = useState<'details' | 'date' | 'time'>('details');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('details');
      setSelectedDate(undefined);
      setSelectedTime(null);
      setAvailableSlots([]);
    }
  }, [open]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (selectedDate && booking) {
      const fetchSlots = async () => {
        setIsLoading(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const result = await getAvailableSlotsForReschedule(
          booking.id,
          dateStr,
        );
        if (result.success && result.slots) {
          setAvailableSlots(result.slots);
          setDurationMinutes(result.durationMinutes || 30);
        } else {
          setAvailableSlots([]);
          toast.error('Failed to load available times');
        }
        setIsLoading(false);
      };
      fetchSlots();
    }
  }, [selectedDate, booking]);

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      // Calculate new start and end times
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newStart = new Date(selectedDate);
      newStart.setHours(hours, minutes, 0, 0);
      const newEnd = addMinutes(newStart, durationMinutes);

      const result = await rescheduleBooking(
        booking.id,
        newStart.toISOString(),
        newEnd.toISOString(),
      );

      if (result.success) {
        toast.success('Booking rescheduled successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to reschedule booking');
      }
    } catch {
      toast.error('Failed to reschedule booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    setIsCancelling(true);
    try {
      const result = await cancelBooking(booking.id);
      if (result.success) {
        toast.success('Booking cancelled');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to cancel booking');
      }
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!booking) return null;

  const bookingDate = parseISO(booking.start_time);
  const isPastBooking = bookingDate < new Date();
  const isCancelled = booking.status === 'cancelled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' && 'Booking Details'}
            {step === 'date' && 'Select New Date'}
            {step === 'time' && 'Select New Time'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' &&
              'View booking details or reschedule this meeting'}
            {step === 'date' && 'Choose a new date for this booking'}
            {step === 'time' &&
              `Available times for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Guest</p>
                <p className="font-medium">{booking.guest_name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.guest_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meeting Type</p>
                <p className="font-medium">
                  {booking.meeting_types?.name || 'Meeting'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.meeting_types?.duration_minutes || 30} minutes
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="font-medium">
                {format(bookingDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm">
                {format(bookingDate, 'h:mm a')} -{' '}
                {format(parseISO(booking.end_time), 'h:mm a')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={isCancelled ? 'secondary' : 'default'}>
                {booking.status}
              </Badge>
            </div>

            {booking.meet_link && (
              <div>
                <p className="text-sm text-muted-foreground">Google Meet</p>
                <a
                  href={booking.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Join Meeting
                </a>
              </div>
            )}

            {booking.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </div>
        )}

        {step === 'date' && (
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
        )}

        {step === 'time' && (
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  Loading available times...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  No available times for this date
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const [hours, minutes] = slot.split(':').map(Number);
                  const slotDate = new Date();
                  slotDate.setHours(hours, minutes, 0, 0);
                  const formattedTime = format(slotDate, 'h:mm a');

                  return (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(slot)}
                      className="w-full"
                    >
                      {formattedTime}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {step === 'details' && (
            <>
              {!isCancelled && !isPastBooking && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                  <Button onClick={() => setStep('date')}>Reschedule</Button>
                </>
              )}
              {(isCancelled || isPastBooking) && (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </>
          )}

          {step === 'date' && (
            <>
              <Button variant="outline" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button onClick={() => setStep('time')} disabled={!selectedDate}>
                Continue
              </Button>
            </>
          )}

          {step === 'time' && (
            <>
              <Button variant="outline" onClick={() => setStep('date')}>
                Back
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!selectedTime || isLoading}
              >
                {isLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
