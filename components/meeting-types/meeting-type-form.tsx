'use client';

import { useEffect, useState, useTransition } from 'react';
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
  createMeetingType,
  generateSlug,
  updateMeetingType,
} from '@/lib/actions/meeting-types';
import type { MeetingType } from '@/lib/supabase/types';

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
];

interface MeetingTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingType?: MeetingType | null;
}

export function MeetingTypeForm({
  open,
  onOpenChange,
  meetingType,
}: MeetingTypeFormProps) {
  const isEditing = !!meetingType;
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [duration, setDuration] = useState('30');
  const [description, setDescription] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Reset form when dialog opens/closes or meetingType changes
  useEffect(() => {
    if (open) {
      if (meetingType) {
        setName(meetingType.name);
        setSlug(meetingType.slug);
        setDuration(String(meetingType.duration_minutes));
        setDescription(meetingType.description || '');
        setSlugManuallyEdited(true);
      } else {
        setName('');
        setSlug('');
        setDuration('30');
        setDescription('');
        setSlugManuallyEdited(false);
      }
    }
  }, [open, meetingType]);

  // Auto-generate slug from name (only if not manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      generateSlug(name).then(setSlug);
    }
  }, [name, slugManuallyEdited]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    // Only allow lowercase letters, numbers, and hyphens
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!slug.trim()) {
      toast.error('URL slug is required');
      return;
    }

    startTransition(async () => {
      if (isEditing && meetingType) {
        const result = await updateMeetingType(meetingType.id, {
          name: name.trim(),
          slug: slug.trim(),
          durationMinutes: parseInt(duration),
          description: description.trim(),
        });

        if (result.success) {
          toast.success('Meeting type updated');
          onOpenChange(false);
        } else {
          toast.error(result.error || 'Failed to update');
        }
      } else {
        const result = await createMeetingType({
          name: name.trim(),
          slug: slug.trim(),
          durationMinutes: parseInt(duration),
          description: description.trim() || undefined,
        });

        if (result.success) {
          toast.success('Meeting type created');
          onOpenChange(false);
        } else {
          toast.error(result.error || 'Failed to create');
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Meeting Type' : 'Create Meeting Type'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details of your meeting type.'
                : 'Create a new meeting type that people can book.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 30 Minute Call"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  /book/you/
                </span>
                <Input
                  id="slug"
                  placeholder="30-minute-call"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={isPending}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select
                value={duration}
                onValueChange={setDuration}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this meeting type..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={3}
              />
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
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
