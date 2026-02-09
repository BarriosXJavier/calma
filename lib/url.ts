// URL utilities
export function generateBookingUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/book/${slug}`;
}

export function getPublicBookingUrl(slug: string, meetingType?: string): string {
  const baseUrl = generateBookingUrl(slug);
  return meetingType ? `${baseUrl}/${meetingType}` : baseUrl;
}
