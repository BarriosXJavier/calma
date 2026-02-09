'use client';

import { addMinutes, format, parseISO } from 'date-fns';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { BookingDatePicker } from '@/components/booking/booking-date-picker';
import { BookingForm } from '@/components/booking/booking-form';
import { TimeSlotPicker } from '@/components/booking/time-slot-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createBooking } from '@/lib/actions/booking';
import { getAvailableSlots } from '@/lib/actions/public-booking';

interface BookingClientProps {
  host: {
    id: string;
    name: string | null;
    slug: string;
    timezone: string;
  };
  meetingType: {
    id: string;
    name: string;
    slug: string;
    duration_minutes: number;
    description: string | null;
  };
  availableDates: string[];
}

type Step = 'date' | 'time' | 'details';

export function BookingClient({
  host,
  meetingType,
  availableDates,
}: BookingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Get guest timezone
  const guestTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedTime(undefined);

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const result = await getAvailableSlots(
        host.id,
        meetingType.id,
        dateStr,
        guestTimezone,
      );

      if (result.success && result.slots) {
        setAvailableSlots(result.slots);
      } else {
        setAvailableSlots([]);
        toast.error('Failed to load available times');
      }

      setIsLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate, host.id, meetingType.id, guestTimezone]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep('time');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleBookingSubmit = async (data: {
    guestName: string;
    guestEmail: string;
    notes: string;
  }) => {
    if (!selectedDate || !selectedTime) return;

    startTransition(async () => {
      // Calculate start and end times
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, meetingType.duration_minutes);

      const result = await createBooking({
        hostId: host.id,
        meetingTypeId: meetingType.id,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        guestTimezone,
        notes: data.notes || undefined,
      });

      if (result.success && result.booking) {
        router.push(
          `/book/${host.slug}/${meetingType.slug}/confirmed?id=${result.booking.id}`,
        );
      } else {
        toast.error(result.error || 'Failed to create booking');
      }
    });
  };

  const goBack = () => {
    if (step === 'time') {
      setStep('date');
      setSelectedTime(undefined);
    } else if (step === 'details') {
      setStep('time');
    }
  };

  // Format selected date/time for display
  const formatSelectedDateTime = () => {
    if (!selectedDate) return '';
    const dateStr = format(selectedDate, 'EEEE, MMMM d, yyyy');
    if (!selectedTime) return dateStr;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;

    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Back Link */}
        <Link
          href={`/book/${host.slug}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {host.name || 'host'}
        </Link>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Left Sidebar - Meeting Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-primary">
                    {host.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{host.name}</p>
                <CardTitle className="text-xl">{meetingType.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{meetingType.duration_minutes} minutes</span>
                </div>

                {selectedDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatSelectedDateTime()}</span>
                  </div>
                )}

                {meetingType.description && (
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    {meetingType.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Times shown in your timezone ({guestTimezone})
            </p>
          </div>

          {/* Right - Booking Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {step === 'date' && 'Select a Date'}
                  {step === 'time' && 'Select a Time'}
                  {step === 'details' && 'Enter Your Details'}
                </CardTitle>
                {step !== 'date' && (
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {step === 'date' && (
                <BookingDatePicker
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                />
              )}

              {step === 'time' && (
                <TimeSlotPicker
                  slots={availableSlots}
                  selectedTime={selectedTime}
                  onSelect={handleTimeSelect}
                  isLoading={isLoadingSlots}
                />
              )}

              {step === 'details' && (
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">{formatSelectedDateTime()}</p>
                      <p className="text-muted-foreground">
                        {meetingType.duration_minutes} minute meeting
                      </p>
                    </div>
                  </div>

                  <BookingForm
                    onSubmit={handleBookingSubmit}
                    isLoading={isPending}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
