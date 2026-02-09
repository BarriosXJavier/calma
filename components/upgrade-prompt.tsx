'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function UpgradePrompt() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Upgrade your plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You've reached the limit of your current plan. Upgrade to unlock more features.
        </p>
        <Button asChild>
          <Link href="/pricing">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
