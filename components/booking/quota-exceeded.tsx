'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface QuotaExceededProps {
  title?: string;
  message?: string;
}

export function QuotaExceeded({
  title = 'Quota Exceeded',
  message = 'You have reached your plan limit. Upgrade to continue.',
}: QuotaExceededProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild>
          <Link href="/pricing">Upgrade Plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
