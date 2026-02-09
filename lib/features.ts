// Feature flags and limits
export const FEATURES = {
  FREE_MAX_CALENDARS: 1,
  STARTER_MAX_CALENDARS: 3,
  FREE_MAX_BOOKINGS_PER_MONTH: 2,
  STARTER_MAX_BOOKINGS_PER_MONTH: 10,
} as const;

export function canAddCalendar(tier: string, currentCount: number): boolean {
  if (tier === 'pro') return true;
  if (tier === 'starter') return currentCount < FEATURES.STARTER_MAX_CALENDARS;
  return currentCount < FEATURES.FREE_MAX_CALENDARS;
}

export function canCreateBooking(tier: string, currentCount: number): boolean {
  if (tier === 'pro') return true;
  if (tier === 'starter') return currentCount < FEATURES.STARTER_MAX_BOOKINGS_PER_MONTH;
  return currentCount < FEATURES.FREE_MAX_BOOKINGS_PER_MONTH;
}
