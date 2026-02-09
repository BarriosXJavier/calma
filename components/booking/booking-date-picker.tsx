'use client';

import { isSameDay, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

interface BookingDatePickerProps {
  availableDates: string[];
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export function BookingDatePicker({
  availableDates,
  selectedDate,
  onSelect,
}: BookingDatePickerProps) {
  const availableDateObjects = availableDates.map((d) => parseISO(d));

  // Disable dates that are not in the available dates list
  const isDateDisabled = (date: Date) => {
    return !availableDateObjects.some((availableDate) =>
      isSameDay(date, availableDate),
    );
  };

  return (
    <div className="flex justify-center">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        disabled={isDateDisabled}
        className="rounded-md border"
        fromDate={new Date()}
        toDate={availableDateObjects[availableDateObjects.length - 1]}
      />
    </div>
  );
}
