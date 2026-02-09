'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserProfile, checkSlugAvailability } from '@/lib/actions/user';
import { toast } from 'sonner';

// Common timezones
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string;
    slug: string;
    timezone: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name || '');
  const [slug, setSlug] = useState(user.slug);
  const [timezone, setTimezone] = useState(user.timezone);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const handleSlugChange = (value: string) => {
    // Sanitize slug: lowercase, alphanumeric and hyphens only
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(sanitized);
    setSlugError(null);
    setSlugAvailable(null);
  };

  const handleSlugBlur = async () => {
    if (slug === user.slug) {
      setSlugAvailable(null);
      return;
    }

    if (slug.length < 3) {
      setSlugError('URL must be at least 3 characters');
      return;
    }

    const result = await checkSlugAvailability(slug);
    if (result.success) {
      setSlugAvailable(result.available ?? false);
      if (!result.available) {
        setSlugError('This URL is already taken');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (slugError) {
      toast.error('Please fix the errors before saving');
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfile({
        name: name || undefined,
        slug,
        timezone,
      });

      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your public profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Managed by Clerk. Change in your account settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Booking URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {process.env.NEXT_PUBLIC_APP_URL}/book/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
                placeholder="your-url"
                className="flex-1"
              />
            </div>
            {slugError && (
              <p className="text-xs text-destructive">{slugError}</p>
            )}
            {slugAvailable === true && slug !== user.slug && (
              <p className="text-xs text-green-600">This URL is available</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isPending || !!slugError}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
