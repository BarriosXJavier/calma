'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  slots: string[];
  selectedTime: string | undefined;
  onSelect: (time: string) => void;
  isLoading?: boolean;
}

export function TimeSlotPicker({
  slots,
  selectedTime,
  onSelect,
  isLoading,
}: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => `slot-skeleton-${i}`).map(
          (key) => (
            <div key={key} className="h-10 bg-muted animate-pulse rounded-md" />
          ),
        )}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No available times for this date. Please select another day.
      </p>
    );
  }

  // Format time for display (e.g., "09:00" -> "9:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <Button
          key={slot}
          variant={selectedTime === slot ? 'default' : 'outline'}
          className={cn(
            'h-10',
            selectedTime === slot && 'ring-2 ring-primary ring-offset-2',
          )}
          onClick={() => onSelect(slot)}
        >
          {formatTime(slot)}
        </Button>
      ))}
    </div>
  );
}
