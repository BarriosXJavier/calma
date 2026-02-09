import { FeedbackForm } from '@/components/feedback/feedback-form';

export default function FeedbackPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Feedback</h1>
      <p className="text-muted-foreground">
        We value your feedback. Let us know how we can improve.
      </p>
      <FeedbackForm />
    </div>
  );
}
