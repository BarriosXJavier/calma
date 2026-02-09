import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/book(.*)',
  '/api/webhooks(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

// Create a minimal Supabase client for proxy/middleware context
// Uses service role to bypass RLS for admin checks
function createProxySupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  return clerkMiddleware(async (auth, req) => {
    // Protect admin routes
    if (isAdminRoute(req)) {
      const { userId } = await auth();
      if (!userId) {
        return (await auth()).redirectToSignIn();
      }
      
      // Check if user is admin in database
      const supabase = createProxySupabaseClient();
      const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('clerk_id', userId)
        .single();
      
      if (!user?.is_admin) {
        // Redirect non-admin users to home
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    
    return NextResponse.next();
  })(request, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
