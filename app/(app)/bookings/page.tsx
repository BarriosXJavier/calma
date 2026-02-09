import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBookings } from '@/lib/actions/booking';
import type { BookingWithMeetingType } from '@/lib/supabase/types';

export default async function BookingsPage() {
  const result = await getBookings();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Bookings</h1>

      {!result.success ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{result.error}</p>
          </CardContent>
        </Card>
      ) : !result.bookings || result.bookings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No bookings yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Share your booking link to start receiving bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(result.bookings as BookingWithMeetingType[]).map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {booking.meeting_types?.name || 'Meeting'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Guest:</strong> {booking.guest_name} (
                  {booking.guest_email})
                </p>
                <p>
                  <strong>Time:</strong>{' '}
                  {new Date(booking.start_time).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {booking.status}
                </p>
                {booking.meet_link && (
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Join Meet
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
