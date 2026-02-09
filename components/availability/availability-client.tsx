'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Availability } from '@/lib/supabase/types';
import { CopyAvailabilityDialog } from './copy-availability-dialog';
import { DayAvailabilityCard } from './day-availability-card';
import { TimeBlockDialog } from './time-block-dialog';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface AvailabilityClientProps {
  availability: Availability[];
  userSlug: string;
}

export function AvailabilityClient({
  availability,
  userSlug,
}: AvailabilityClientProps) {
  const [timeBlockDialogOpen, setTimeBlockDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<{
    id: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Group availability by day
  const availabilityByDay = DAYS.map((_, index) =>
    availability.filter((a) => a.day_of_week === index),
  );

  // Days that have availability set
  const daysWithAvailability = availabilityByDay
    .map((blocks, index) => (blocks.length > 0 ? index : -1))
    .filter((index) => index !== -1);

  const handleAddBlock = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setEditingBlock(null);
    setTimeBlockDialogOpen(true);
  };

  const handleEditBlock = (block: Availability) => {
    setSelectedDay(block.day_of_week);
    setEditingBlock({
      id: block.id,
      startTime: block.start_time,
      endTime: block.end_time,
    });
    setTimeBlockDialogOpen(true);
  };

  const handleCopyFrom = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setCopyDialogOpen(true);
  };

  const handleTimeBlockDialogClose = (open: boolean) => {
    setTimeBlockDialogOpen(open);
    if (!open) {
      setEditingBlock(null);
      setSelectedDay(null);
    }
  };

  const handleCopyDialogClose = (open: boolean) => {
    setCopyDialogOpen(open);
    if (!open) {
      setSelectedDay(null);
    }
  };

  // Quick actions: Apply to weekdays
  const hasWeekdayAvailability = [1, 2, 3, 4, 5].some(
    (day) => availabilityByDay[day].length > 0,
  );

  return (
    <>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Set your available hours for each day of the week. Guests will only be
          able to book during these times.
        </p>

        {daysWithAvailability.length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Quick Actions</p>
            <p className="text-xs text-muted-foreground mb-3">
              Copy your availability to multiple days at once.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Find first day with availability to copy from
                  const sourceDay = daysWithAvailability[0];
                  if (sourceDay !== undefined) {
                    // This will be handled by the copy dialog with multi-select
                    setSelectedDay(null);
                    setCopyDialogOpen(true);
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Multiple Days
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map((day, index) => (
          <DayAvailabilityCard
            key={day}
            dayIndex={index}
            dayName={day}
            blocks={availabilityByDay[index]}
            onAddBlock={handleAddBlock}
            onEditBlock={handleEditBlock}
            onCopyFrom={handleCopyFrom}
            hasBlocksToCopy={daysWithAvailability.length > 0}
          />
        ))}
      </div>

      <TimeBlockDialog
        open={timeBlockDialogOpen}
        onOpenChange={handleTimeBlockDialogClose}
        dayOfWeek={selectedDay}
        editingBlock={editingBlock}
      />

      <CopyAvailabilityDialog
        open={copyDialogOpen}
        onOpenChange={handleCopyDialogClose}
        targetDay={selectedDay}
        daysWithAvailability={daysWithAvailability}
      />
    </>
  );
}
