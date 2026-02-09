import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/actions/user', () => ({
  getOrCreateUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { getOrCreateUser } from '@/lib/actions/user';
import { createClient } from '@/lib/supabase/server';
import { getBookings } from '@/lib/actions/booking';

type BookingsQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
};

const makeSupabase = (bookingsQuery: BookingsQuery) => ({
  from: vi.fn((table: string) => {
    if (table !== 'bookings') {
      throw new Error(`Unexpected table: ${table}`);
    }
    return bookingsQuery;
  }),
});

describe('getBookings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns bookings for current user', async () => {
    vi.mocked(getOrCreateUser).mockResolvedValue({
      success: true,
      user: { id: 'user_1' },
    });

    const bookingsQuery: BookingsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: 'b1', start_time: '2026-02-01T10:00:00Z' }],
        error: null,
      }),
    };

    vi.mocked(createClient).mockReturnValue(
      makeSupabase(bookingsQuery) as never
    );

    const result = await getBookings();
    expect(result.success).toBe(true);
    expect(result.bookings).toHaveLength(1);
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getOrCreateUser).mockResolvedValue({
      success: false,
      error: 'Not authenticated',
    });

    const result = await getBookings();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });
});
