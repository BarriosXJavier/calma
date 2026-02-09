'use client';

import { X } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { deleteAvailabilityBlock } from '@/lib/actions/availability';

interface TimeBlockProps {
  id: string;
  startTime: string;
  endTime: string;
  onEdit: () => void;
}

export function TimeBlock({ id, startTime, endTime, onEdit }: TimeBlockProps) {
  const [isPending, startTransition] = useTransition();

  // Format time for display (e.g., "09:00" -> "9:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAvailabilityBlock(id);
      if (result.success) {
        toast.success('Time block removed');
      } else {
        toast.error(result.error || 'Failed to remove');
      }
    });
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        bg-primary/10 hover:bg-primary/20 
        rounded-full text-sm transition-colors
        ${isPending ? 'opacity-50' : ''}
      `}
    >
      <button
        type="button"
        onClick={onEdit}
        className="hover:underline"
        disabled={isPending}
      >
        {formatTime(startTime)} - {formatTime(endTime)}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Remove time block"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
