import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      '1 connected calendar',
      '2 bookings per month',
      'Basic meeting types',
      'Email notifications',
    ],
    cta: 'Get Started',
    href: '/sign-up',
  },
  {
    name: 'Starter',
    price: '$9',
    period: '/month',
    description: 'For growing professionals',
    features: [
      '3 connected calendars',
      '10 bookings per month',
      'Custom meeting types',
      'Priority support',
      'Calendar sync',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For power users',
    features: [
      'Unlimited calendars',
      'Unlimited bookings',
      'Advanced scheduling',
      'Team features',
      'API access',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up',
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={plan.popular ? 'border-primary relative' : ''}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
