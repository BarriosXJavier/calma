import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect('/bookings');
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Scheduling made <span className="text-primary">simple</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Calma helps you manage your time effortlessly. Connect your calendar,
          set your availability, and let others book time with you.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Google Calendar Sync"
            description="Automatically sync with your Google Calendar to avoid double bookings."
            icon="📅"
          />
          <FeatureCard
            title="Custom Meeting Types"
            description="Create different meeting types with custom durations and descriptions."
            icon="⚙️"
          />
          <FeatureCard
            title="Easy Sharing"
            description="Share your booking link and let others schedule time with you."
            icon="🔗"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to simplify your scheduling?</h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of professionals who use Calma to manage their time.
        </p>
        <Button asChild size="lg">
          <Link href="/sign-up">Start for Free</Link>
        </Button>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="p-6 border rounded-lg text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
