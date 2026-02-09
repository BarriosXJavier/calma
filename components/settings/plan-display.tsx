import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, Calendar, Users } from 'lucide-react';

interface UsageStats {
  tier: string;
  calendars: {
    used: number;
    limit: number;
  };
  bookings: {
    used: number;
    limit: number;
  };
}

interface PlanDisplayProps {
  stats: UsageStats;
}

const PLAN_DETAILS: Record<string, { name: string; price: string; description: string }> = {
  free: {
    name: 'Free',
    price: '$0/month',
    description: 'Basic scheduling features',
  },
  starter: {
    name: 'Starter',
    price: '$9/month',
    description: 'For growing professionals',
  },
  pro: {
    name: 'Pro',
    price: '$29/month',
    description: 'Unlimited everything',
  },
};

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const percentage = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === Infinity;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && used >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? 'text-destructive font-medium' : ''}>
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isAtLimit
                ? 'bg-destructive'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PlanDisplay({ stats }: PlanDisplayProps) {
  const plan = PLAN_DETAILS[stats.tier] || PLAN_DETAILS.free;
  const isFreePlan = stats.tier === 'free';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Current Plan
        </CardTitle>
        <CardDescription>
          Manage your subscription and view usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{plan.price}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Usage This Month</h4>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <UsageBar
                  used={stats.calendars.used}
                  limit={stats.calendars.limit}
                  label="Connected Calendars"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <UsageBar
                  used={stats.bookings.used}
                  limit={stats.bookings.limit}
                  label="Bookings This Month"
                />
              </div>
            </div>
          </div>
        </div>

        {isFreePlan && (
          <div className="pt-4 border-t">
            <Button asChild className="w-full">
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          </div>
        )}

        {!isFreePlan && (
          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full">
              <Link href="/pricing">View All Plans</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
