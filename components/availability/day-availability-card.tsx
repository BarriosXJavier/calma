'use client';

import { Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Availability } from '@/lib/supabase/types';
import { TimeBlock } from './time-block';

interface DayAvailabilityCardProps {
  dayIndex: number;
  dayName: string;
  blocks: Availability[];
  onAddBlock: (dayIndex: number) => void;
  onEditBlock: (block: Availability) => void;
  onCopyFrom: (dayIndex: number) => void;
  hasBlocksToCopy: boolean;
}

export function DayAvailabilityCard({
  dayIndex,
  dayName,
  blocks,
  onAddBlock,
  onEditBlock,
  onCopyFrom,
  hasBlocksToCopy,
}: DayAvailabilityCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{dayName}</CardTitle>
          <div className="flex items-center gap-2">
            {hasBlocksToCopy && blocks.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyFrom(dayIndex)}
                className="text-muted-foreground"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddBlock(dayIndex)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Unavailable</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blocks
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((block) => (
                <TimeBlock
                  key={block.id}
                  id={block.id}
                  startTime={block.start_time}
                  endTime={block.end_time}
                  onEdit={() => onEditBlock(block)}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
