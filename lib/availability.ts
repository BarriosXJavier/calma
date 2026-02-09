// Availability logic utilities
import { format, } from 'date-fns';

export interface AvailabilityBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function getAvailabilityForDate(
  availability: AvailabilityBlock[],
  date: Date
): AvailabilityBlock[] {
  const dayOfWeek = date.getDay();
  return availability.filter((block) => block.day_of_week === dayOfWeek);
}

export function isTimeInAvailability(
  time: Date,
  availability: AvailabilityBlock[]
): boolean {
  const dayOfWeek = time.getDay();
  const timeString = format(time, 'HH:mm:ss');
  
  const dayAvailability = availability.filter(
    (block) => block.day_of_week === dayOfWeek
  );
  
  return dayAvailability.some(
    (block) => timeString >= block.start_time && timeString < block.end_time
  );
}

export function getNextAvailableSlot(
  availability: AvailabilityBlock[],
  fromDate: Date,
  _durationMinutes: number
): Date | null {
  const currentDate = new Date(fromDate);
  
  // Look for the next 30 days
  for (let i = 0; i < 30; i++) {
    const dayAvailability = getAvailabilityForDate(availability, currentDate);
    
    if (dayAvailability.length > 0) {
      // Return the start of the first available block
      const firstBlock = dayAvailability[0];
      const [hours, minutes] = firstBlock.start_time.split(':').map(Number);
      const slot = new Date(currentDate);
      slot.setHours(hours, minutes, 0, 0);
      
      if (slot > fromDate) {
        return slot;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return null;
}
