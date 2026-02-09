import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getHostBySlug,
  getHostMeetingTypes,
} from '@/lib/actions/public-booking';

interface HostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function HostPage({ params }: HostPageProps) {
  const { slug } = await params;

  const hostResult = await getHostBySlug(slug);
  if (!hostResult.success || !hostResult.host) {
    notFound();
  }

  const host = hostResult.host;
  const meetingTypesResult = await getHostMeetingTypes(host.id);
  const meetingTypes = meetingTypesResult.meetingTypes || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-2xl mx-auto py-12 px-4">
        {/* Host Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {host.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{host.name || 'User'}</h1>
          <p className="text-muted-foreground mt-1">
            Select a meeting type to schedule
          </p>
        </div>

        {/* Meeting Types */}
        {meetingTypes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No meeting types available at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetingTypes.map((meetingType) => (
              <Link
                key={meetingType.id}
                href={`/book/${slug}/${meetingType.slug}`}
                className="block"
              >
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {meetingType.name}
                        </CardTitle>
                        {meetingType.description && (
                          <CardDescription className="mt-1">
                            {meetingType.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{meetingType.duration_minutes} min</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Calendar className="w-4 h-4" />
                      <span>View available times</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Timezone Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Times shown in {host.timezone}
        </p>
      </div>
    </div>
  );
}
