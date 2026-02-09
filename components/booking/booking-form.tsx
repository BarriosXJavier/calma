'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BookingFormData {
  guestName: string;
  guestEmail: string;
  notes: string;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading: boolean;
}

export function BookingForm({ onSubmit, isLoading }: BookingFormProps) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ guestName, guestEmail, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Your Name *</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information you'd like to share..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Scheduling...' : 'Confirm Booking'}
      </Button>
    </form>
  );
}
