import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { AvailabilityClient } from '@/components/availability/availability-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAvailability } from '@/lib/actions/availability';
import { getCurrentUser } from '@/lib/actions/user';
import type { Availability } from '@/lib/supabase/types';

export default async function AvailabilityPage() {
  const [availabilityResult, userResult] = await Promise.all([
    getAvailability(),
    getCurrentUser(),
  ]);

  const userSlug =
    userResult.success && userResult.user ? userResult.user.slug : 'your-slug';

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${userSlug}`;

  if (!availabilityResult.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Your Availability</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{availabilityResult.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Availability</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={bookingUrl} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Booking Page
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(bookingUrl);
            }}
            className="hidden"
          >
            Copy Link
          </Button>
        </div>
      </div>

      <AvailabilityClient
        availability={(availabilityResult.availability || []) as Availability[]}
        userSlug={userSlug}
      />
    </div>
  );
}
