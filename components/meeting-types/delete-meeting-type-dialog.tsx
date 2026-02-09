'use client';

import { useTransition } from 'react';
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
import { deleteMeetingType } from '@/lib/actions/meeting-types';
import type { MeetingType } from '@/lib/supabase/types';

interface DeleteMeetingTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingType: MeetingType | null;
}

export function DeleteMeetingTypeDialog({
  open,
  onOpenChange,
  meetingType,
}: DeleteMeetingTypeDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!meetingType) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMeetingType(meetingType.id);
      if (result.success) {
        toast.success('Meeting type deleted');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Meeting Type</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{meetingType.name}&quot;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

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
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
