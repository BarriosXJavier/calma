'use client';

import { addMinutes, format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createBookingAsHost,
  getAvailableSlotsForCreate,
} from '@/lib/actions/booking';
import { getMeetingTypes } from '@/lib/actions/meeting-types';
import type { MeetingType } from '@/lib/supabase/types';

interface CreateBookingDialogProps {
  selectedDate: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBookingDialog({
  selectedDate,
  open,
  onOpenChange,
  onSuccess,
}: CreateBookingDialogProps) {
  const [step, setStep] = useState<'type' | 'time' | 'details'>('type');
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const fetchMeetingTypes = useCallback(async () => {
    setIsLoading(true);
    const result = await getMeetingTypes();
    if (result.success && result.meetingTypes) {
      setMeetingTypes(result.meetingTypes);
      // Auto-select if only one meeting type
      if (result.meetingTypes.length === 1) {
        setSelectedMeetingType(result.meetingTypes[0].id);
      }
    } else {
      toast.error('Failed to load meeting types');
    }
    setIsLoading(false);
  }, []);

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDate || !selectedMeetingType) return;

    setIsLoadingSlots(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const result = await getAvailableSlotsForCreate(
      selectedMeetingType,
      dateStr,
    );
    if (result.success && result.slots) {
      setAvailableSlots(result.slots);
      setDurationMinutes(result.durationMinutes || 30);
    } else {
      setAvailableSlots([]);
      toast.error('Failed to load available times');
    }
    setIsLoadingSlots(false);
  }, [selectedDate, selectedMeetingType]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('type');
      setSelectedMeetingType('');
      setSelectedTime(null);
      setAvailableSlots([]);
      setGuestName('');
      setGuestEmail('');
      setNotes('');
      // Fetch meeting types
      fetchMeetingTypes();
    }
  }, [open, fetchMeetingTypes]);

  // Fetch available slots when meeting type is selected
  useEffect(() => {
    if (selectedMeetingType && selectedDate && step === 'time') {
      fetchAvailableSlots();
    }
  }, [selectedMeetingType, selectedDate, step, fetchAvailableSlots]);

  const handleCreate = async () => {
    if (!selectedDate || !selectedTime || !selectedMeetingType) return;
    if (!guestName.trim() || !guestEmail.trim()) {
      toast.error('Please fill in guest name and email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate start and end times
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, durationMinutes);

      const result = await createBookingAsHost({
        meetingTypeId: selectedMeetingType,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast.success('Booking created successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create booking');
      }
    } catch {
      toast.error('Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMeetingTypeData = meetingTypes.find(
    (mt) => mt.id === selectedMeetingType,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' && 'Create Booking'}
            {step === 'time' && 'Select Time'}
            {step === 'details' && 'Guest Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' && (
              <>
                Create a booking for{' '}
                <span className="font-medium">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                </span>
              </>
            )}
            {step === 'time' && 'Choose an available time slot'}
            {step === 'details' && 'Enter the guest information'}
          </DialogDescription>
        </DialogHeader>

        {step === 'type' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  Loading meeting types...
                </p>
              </div>
            ) : meetingTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="text-muted-foreground">No meeting types found</p>
                <p className="text-sm text-muted-foreground">
                  Create a meeting type first in the Meeting Types page
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select
                  value={selectedMeetingType}
                  onValueChange={setSelectedMeetingType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((mt) => (
                      <SelectItem key={mt.id} value={mt.id}>
                        {mt.name} ({mt.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMeetingTypeData?.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedMeetingTypeData.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'time' && (
          <div className="max-h-[300px] overflow-y-auto">
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  Loading available times...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="text-muted-foreground">
                  No available times for this date
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your availability settings or select a different date
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const [hours, minutes] = slot.split(':').map(Number);
                  const slotDate = new Date();
                  slotDate.setHours(hours, minutes, 0, 0);
                  const formattedTime = format(slotDate, 'h:mm a');

                  return (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(slot)}
                      className="w-full"
                    >
                      {formattedTime}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">
                {selectedMeetingTypeData?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}{' '}
                at{' '}
                {selectedTime
                  ? (() => {
                      const [hours, minutes] = selectedTime
                        .split(':')
                        .map(Number);
                      const slotDate = new Date();
                      slotDate.setHours(hours, minutes, 0, 0);
                      return format(slotDate, 'h:mm a');
                    })()
                  : ''}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name *</Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestEmail">Guest Email *</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for this booking..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {step === 'type' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('time')}
                disabled={!selectedMeetingType || isLoading}
              >
                Continue
              </Button>
            </>
          )}

          {step === 'time' && (
            <>
              <Button variant="outline" onClick={() => setStep('type')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedTime}
              >
                Continue
              </Button>
            </>
          )}

          {step === 'details' && (
            <>
              <Button variant="outline" onClick={() => setStep('time')}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!guestName.trim() || !guestEmail.trim() || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Booking'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
