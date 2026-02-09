'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addAvailabilityBlock,
  updateAvailabilityBlock,
} from '@/lib/actions/availability';

// Generate time options in 30-minute increments
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      const label = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface TimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: number | null;
  editingBlock?: {
    id: string;
    startTime: string;
    endTime: string;
  } | null;
}

export function TimeBlockDialog({
  open,
  onOpenChange,
  dayOfWeek,
  editingBlock,
}: TimeBlockDialogProps) {
  const isEditing = !!editingBlock;
  const [isPending, startTransition] = useTransition();

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      if (editingBlock) {
        setStartTime(editingBlock.startTime.slice(0, 5));
        setEndTime(editingBlock.endTime.slice(0, 5));
      } else {
        setStartTime('09:00');
        setEndTime('17:00');
      }
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (dayOfWeek === null) return;

    // Validate times
    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    startTransition(async () => {
      if (isEditing && editingBlock) {
        const result = await updateAvailabilityBlock(editingBlock.id, {
          startTime,
          endTime,
        });

        if (result.success) {
          toast.success('Time block updated');
          onOpenChange(false);
        } else {
          toast.error(result.error || 'Failed to update');
        }
      } else {
        const result = await addAvailabilityBlock({
          dayOfWeek,
          startTime,
          endTime,
        });

        if (result.success) {
          toast.success('Time block added');
          onOpenChange(false);
        } else {
          toast.error(result.error || 'Failed to add');
        }
      }
    });
  };

  if (dayOfWeek === null) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Time Block' : 'Add Time Block'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Update availability for ${DAYS[dayOfWeek]}`
                : `Add available hours for ${DAYS[dayOfWeek]}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Select
                value={startTime}
                onValueChange={setStartTime}
                disabled={isPending}
              >
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Select
                value={endTime}
                onValueChange={setEndTime}
                disabled={isPending}
              >
                <SelectTrigger id="end-time">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.filter((opt) => opt.value > startTime).map(
                    (option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Adding...'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Block'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
