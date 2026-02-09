'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submitFeedback } from '@/lib/actions/feedback';
import { toast } from 'sonner';

export function FeedbackForm() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitFeedback(content);
      
      if (result.success) {
        toast.success('Thank you for your feedback!');
        setContent('');
      } else {
        toast.error(result.error || 'Failed to submit feedback');
      }
    } catch (_error) {
      toast.error('An error occurred while submitting feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Tell us what you think..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
