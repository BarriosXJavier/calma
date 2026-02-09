import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBookingDetails } from '@/lib/actions/public-booking';

interface ConfirmedPageProps {
  params: Promise<{ slug: string; meetingType: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function ConfirmedPage({
  params,
  searchParams,
}: ConfirmedPageProps) {
  const { slug } = await params;
  const { id: bookingId } = await searchParams;

  if (!bookingId) {
    notFound();
  }

  const result = await getBookingDetails(bookingId);
  if (!result.success || !result.booking) {
    notFound();
  }

  const booking = result.booking;
  const meetingType = booking.meeting_types as {
    name: string;
    duration_minutes: number;
  } | null;
  const host = booking.users as { name: string; timezone: string } | null;

  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);

  // Generate Google Calendar add link
  const googleCalendarUrl = new URL(
    'https://calendar.google.com/calendar/render',
  );
  googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
  googleCalendarUrl.searchParams.set('text', meetingType?.name || 'Meeting');
  googleCalendarUrl.searchParams.set(
    'dates',
    `${format(startTime, "yyyyMMdd'T'HHmmss")}/${format(endTime, "yyyyMMdd'T'HHmmss")}`,
  );
  googleCalendarUrl.searchParams.set(
    'details',
    booking.meet_link ? `Join: ${booking.meet_link}` : '',
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              A calendar invitation has been sent to your email.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meeting Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">
                {meetingType?.name || 'Meeting'}
              </h3>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  <span className="text-muted-foreground ml-1">
                    ({booking.guest_timezone})
                  </span>
                </span>
              </div>

              {host && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {host.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span>with {host.name}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{booking.guest_email}</span>
              </div>
            </div>

            {/* Google Meet Link */}
            {booking.meet_link && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Google Meet</span>
                </div>
                <a
                  href={booking.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {booking.meet_link}
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  This link will be active at the scheduled time.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a
                  href={googleCalendarUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Google Calendar
                </a>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href={`/book/${slug}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Book Another Meeting
                </Link>
              </Button>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Your Notes:
                </p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
