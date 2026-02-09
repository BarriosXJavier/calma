import { BookingsClient } from '@/components/bookings/bookings-client';
import { Card, CardContent } from '@/components/ui/card';
import { getBookings } from '@/lib/actions/booking';
import type { BookingWithMeetingType } from '@/lib/supabase/types';

export default async function BookingsPage() {
  const result = await getBookings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Bookings</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your scheduled meetings
        </p>
      </div>

      {!result.success ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{result.error}</p>
          </CardContent>
        </Card>
      ) : (
        <BookingsClient
          initialBookings={(result.bookings || []) as BookingWithMeetingType[]}
        />
      )}
    </div>
  );
}
