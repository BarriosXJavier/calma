import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { auth, currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getOrCreateUser } from '@/lib/actions/user';

type SupabaseQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
};

const makeSupabase = (usersQuery: SupabaseQuery) => ({
  from: vi.fn((table: string) => {
    if (table !== 'users') {
      throw new Error(`Unexpected table: ${table}`);
    }
    return usersQuery;
  }),
});

describe('getOrCreateUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns existing user when present', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk_123' });

    const usersQuery: SupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user_1', clerk_id: 'clerk_123' },
        error: null,
      }),
      insert: vi.fn(),
    };

    vi.mocked(createServiceClient).mockReturnValue(
      makeSupabase(usersQuery) as never
    );

    const result = await getOrCreateUser();
    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('user_1');
    expect(usersQuery.insert).not.toHaveBeenCalled();
  });

  it('creates user when missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk_456' });
    vi.mocked(currentUser).mockResolvedValue({
      firstName: 'Ava',
      lastName: 'Stone',
      emailAddresses: [{ emailAddress: 'ava@example.com' }],
    } as never);

    const usersQuery: SupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        })
        .mockResolvedValueOnce({
          data: { id: 'user_2', clerk_id: 'clerk_456' },
          error: null,
        }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createServiceClient).mockReturnValue(
      makeSupabase(usersQuery) as never
    );

    const result = await getOrCreateUser();
    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('user_2');
    expect(usersQuery.insert).toHaveBeenCalledOnce();
  });

  it('fails when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const result = await getOrCreateUser();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });
});
