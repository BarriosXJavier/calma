import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthUrl } from '@/lib/google/oauth';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    // Redirect to sign-in if not authenticated
    return NextResponse.redirect(
      new URL('/sign-in?redirect_url=/settings', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  try {
    // Redirect directly to Google OAuth
    const authUrl = getAuthUrl(userId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    return NextResponse.redirect(
      new URL('/settings?error=oauth_init_failed', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
