import { MeetingTypesClient } from '@/components/meeting-types/meeting-types-client';
import { Card, CardContent } from '@/components/ui/card';
import { getMeetingTypes } from '@/lib/actions/meeting-types';
import { getCurrentUser } from '@/lib/actions/user';
import type { MeetingType } from '@/lib/supabase/types';

export default async function MeetingTypesPage() {
  const [meetingTypesResult, userResult] = await Promise.all([
    getMeetingTypes(),
    getCurrentUser(),
  ]);

  if (!meetingTypesResult.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meeting Types</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{meetingTypesResult.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userSlug =
    userResult.success && userResult.user ? userResult.user.slug : 'your-slug';

  return (
    <div className="space-y-6">
      <MeetingTypesClient
        meetingTypes={meetingTypesResult.meetingTypes as MeetingType[]}
        userSlug={userSlug}
      />
    </div>
  );
}
