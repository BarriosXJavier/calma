'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { MeetingType } from '@/lib/supabase/types';
import { DeleteMeetingTypeDialog } from './delete-meeting-type-dialog';
import { MeetingTypeCard } from './meeting-type-card';
import { MeetingTypeForm } from './meeting-type-form';

interface MeetingTypesClientProps {
  meetingTypes: MeetingType[];
  userSlug: string;
}

export function MeetingTypesClient({
  meetingTypes,
  userSlug,
}: MeetingTypesClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMeetingType, setSelectedMeetingType] =
    useState<MeetingType | null>(null);

  const handleEdit = (meetingType: MeetingType) => {
    setSelectedMeetingType(meetingType);
    setFormOpen(true);
  };

  const handleDelete = (meetingType: MeetingType) => {
    setSelectedMeetingType(meetingType);
    setDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedMeetingType(null);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setSelectedMeetingType(null);
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setSelectedMeetingType(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meeting Types</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage the types of meetings people can book with you.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Meeting Type
        </Button>
      </div>

      {meetingTypes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No meeting types yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first meeting type to start accepting bookings.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Meeting Type
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meetingTypes.map((meetingType) => (
            <MeetingTypeCard
              key={meetingType.id}
              meetingType={meetingType}
              userSlug={userSlug}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <MeetingTypeForm
        open={formOpen}
        onOpenChange={handleFormClose}
        meetingType={selectedMeetingType}
      />

      <DeleteMeetingTypeDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        meetingType={selectedMeetingType}
      />
    </>
  );
}
