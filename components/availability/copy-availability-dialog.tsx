'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { copyDayAvailability } from '@/lib/actions/availability';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface CopyAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDay: number | null; // If null, show multi-select mode
  daysWithAvailability: number[];
}

export function CopyAvailabilityDialog({
  open,
  onOpenChange,
  targetDay,
  daysWithAvailability,
}: CopyAvailabilityDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [sourceDay, setSourceDay] = useState<number | null>(null);
  const [targetDays, setTargetDays] = useState<number[]>([]);

  const isMultiMode = targetDay === null;

  // Reset when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSourceDay(daysWithAvailability[0] ?? null);
      setTargetDays([]);
    }
    onOpenChange(newOpen);
  };

  const toggleTargetDay = (day: number) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleCopy = () => {
    if (sourceDay === null) return;

    const daysToApply = isMultiMode
      ? targetDays
      : targetDay !== null
        ? [targetDay]
        : [];

    if (daysToApply.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    startTransition(async () => {
      const result = await copyDayAvailability(sourceDay, daysToApply);
      if (result.success) {
        const dayNames = daysToApply.map((d) => DAYS[d]).join(', ');
        toast.success(
          `Copied availability from ${DAYS[sourceDay]} to ${dayNames}`,
        );
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to copy availability');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Availability</DialogTitle>
          <DialogDescription>
            {isMultiMode
              ? 'Copy availability from one day to multiple days.'
              : `Copy availability from another day to ${targetDay !== null ? DAYS[targetDay] : ''}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <Label>Copy from:</Label>
            <div className="space-y-2">
              {daysWithAvailability.map((dayIndex) => (
                <div key={dayIndex} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${dayIndex}`}
                    checked={sourceDay === dayIndex}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSourceDay(dayIndex);
                        // Remove from target if selected as source
                        setTargetDays((prev) =>
                          prev.filter((d) => d !== dayIndex),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`source-${dayIndex}`}
                    className="font-normal cursor-pointer"
                  >
                    {DAYS[dayIndex]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {isMultiMode && sourceDay !== null && (
            <div className="space-y-3 border-t pt-4">
              <Label>Copy to:</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day, index) => {
                  if (index === sourceDay) return null;
                  return (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`target-${index}`}
                        checked={targetDays.includes(index)}
                        onCheckedChange={() => toggleTargetDay(index)}
                      />
                      <Label
                        htmlFor={`target-${index}`}
                        className="font-normal cursor-pointer"
                      >
                        {day}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTargetDays(
                      [1, 2, 3, 4, 5].filter((d) => d !== sourceDay),
                    )
                  }
                >
                  Weekdays
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTargetDays([0, 6].filter((d) => d !== sourceDay))
                  }
                >
                  Weekends
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTargetDays(
                      DAYS.map((_, i) => i).filter((d) => d !== sourceDay),
                    )
                  }
                >
                  All Days
                </Button>
              </div>
            </div>
          )}
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
          <Button
            onClick={handleCopy}
            disabled={
              isPending ||
              sourceDay === null ||
              (isMultiMode && targetDays.length === 0)
            }
          >
            {isPending ? 'Copying...' : 'Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
