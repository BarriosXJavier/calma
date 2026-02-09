import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTokens } from '@/lib/google/oauth';
import { encrypt } from '@/lib/google/encryption';
import { createServiceClient } from '@/lib/supabase/server';
import { getOrCreateUser } from '@/lib/actions/user';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL('/settings?error=google_auth_failed', process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=no_code', process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  try {
    // Get current user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in?redirect_url=/settings', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const tokens = await getTokens(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing tokens from Google');
    }

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    
    const userInfo = await userInfoResponse.json();

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // Get the internal user ID from our database using Clerk ID
    const result = await getOrCreateUser();
    if (!result.success || !result.user) {
      throw new Error(result.error || 'User not found in database');
    }

    const supabase = createServiceClient();
    const { error: insertError } = await supabase.from('connected_accounts').insert({
      user_id: result.user.id,
      google_account_id: userInfo.id,
      email: userInfo.email,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.redirect(
      new URL('/settings?success=calendar_connected', process.env.NEXT_PUBLIC_APP_URL)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/settings?error=connection_failed', process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
