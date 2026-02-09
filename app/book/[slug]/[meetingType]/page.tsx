import { notFound } from 'next/navigation';
import { BookingClient } from '@/components/booking/booking-client';
import {
  getAvailableDates,
  getHostBySlug,
  getMeetingTypeBySlug,
} from '@/lib/actions/public-booking';

interface BookingPageProps {
  params: Promise<{ slug: string; meetingType: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug, meetingType: meetingTypeSlug } = await params;

  // Fetch host
  const hostResult = await getHostBySlug(slug);
  if (!hostResult.success || !hostResult.host) {
    notFound();
  }
  const host = hostResult.host;

  // Fetch meeting type
  const meetingTypeResult = await getMeetingTypeBySlug(
    host.id,
    meetingTypeSlug,
  );
  if (!meetingTypeResult.success || !meetingTypeResult.meetingType) {
    notFound();
  }
  const meetingType = meetingTypeResult.meetingType;

  // Fetch available dates
  const datesResult = await getAvailableDates(host.id);
  const availableDates = datesResult.availableDates || [];

  return (
    <BookingClient
      host={host}
      meetingType={meetingType}
      availableDates={availableDates}
    />
  );
}
