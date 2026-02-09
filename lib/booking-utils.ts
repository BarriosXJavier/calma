

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    slots.push(
      `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    );
    
    currentMinute += durationMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }
  
  return slots;
}

export function isTimeSlotAvailable(
  slot: string,
  bookings: { start_time: string; end_time: string }[],
  date: Date
): boolean {
  const slotTime = new Date(date);
  const [hours, minutes] = slot.split(':').map(Number);
  slotTime.setHours(hours, minutes, 0, 0);
  
  return !bookings.some((booking) => {
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);
    return slotTime >= bookingStart && slotTime < bookingEnd;
  });
}
