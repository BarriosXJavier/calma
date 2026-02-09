import { ProfileForm } from '@/components/settings/profile-form';
import { CalendarConnections } from '@/components/settings/calendar-connections';
import { PlanDisplay } from '@/components/settings/plan-display';
import { getCurrentUser, getUserUsageStats } from '@/lib/actions/user';
import { getConnectedAccounts } from '@/lib/actions/calendar';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

function LoadingCard() {
  return (
    <div className="border rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

async function ProfileSection() {
  const result = await getCurrentUser();
  
  if (!result.success || !result.user) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <p className="text-destructive">Failed to load profile</p>
      </div>
    );
  }

  return (
    <ProfileForm
      user={{
        name: result.user.name,
        email: result.user.email,
        slug: result.user.slug,
        timezone: result.user.timezone,
      }}
    />
  );
}

async function CalendarSection() {
  const [accountsResult, statsResult] = await Promise.all([
    getConnectedAccounts(),
    getUserUsageStats(),
  ]);

  if (!accountsResult.success) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <p className="text-destructive">Failed to load calendars</p>
      </div>
    );
  }

  const calendarLimit = statsResult.success 
    ? statsResult.stats?.calendars.limit ?? 1 
    : 1;

  return (
    <CalendarConnections
      accounts={accountsResult.accounts || []}
      calendarLimit={calendarLimit}
    />
  );
}

async function PlanSection() {
  const result = await getUserUsageStats();

  if (!result.success || !result.stats) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <p className="text-destructive">Failed to load plan info</p>
      </div>
    );
  }

  return <PlanDisplay stats={result.stats} />;
}

export default async function SettingsPage() {
  const userResult = await getCurrentUser();
  
  if (!userResult.success) {
    redirect('/sign-in?redirect_url=/settings');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Suspense fallback={<LoadingCard />}>
            <ProfileSection />
          </Suspense>

          <Suspense fallback={<LoadingCard />}>
            <CalendarSection />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<LoadingCard />}>
            <PlanSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
