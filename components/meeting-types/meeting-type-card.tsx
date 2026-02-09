'use client';

import {
  Clock,
  Copy,
  ExternalLink,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  setDefaultMeetingType,
  updateMeetingType,
} from '@/lib/actions/meeting-types';
import type { MeetingType } from '@/lib/supabase/types';

interface MeetingTypeCardProps {
  meetingType: MeetingType;
  userSlug: string;
  onEdit: (meetingType: MeetingType) => void;
  onDelete: (meetingType: MeetingType) => void;
}

export function MeetingTypeCard({
  meetingType,
  userSlug,
  onEdit,
  onDelete,
}: MeetingTypeCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(meetingType.is_active);

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${userSlug}/${meetingType.slug}`;

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    startTransition(async () => {
      const result = await updateMeetingType(meetingType.id, {
        isActive: checked,
      });
      if (!result.success) {
        setIsActive(!checked); // Revert on error
        toast.error(result.error || 'Failed to update');
      } else {
        toast.success(
          checked ? 'Meeting type activated' : 'Meeting type deactivated',
        );
      }
    });
  };

  const handleSetDefault = () => {
    startTransition(async () => {
      const result = await setDefaultMeetingType(meetingType.id);
      if (result.success) {
        toast.success('Set as default meeting type');
      } else {
        toast.error(result.error || 'Failed to set default');
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success('Booking link copied to clipboard');
  };

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{meetingType.name}</CardTitle>
            {meetingType.is_default && (
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3" />
                Default
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(meetingType)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </a>
              </DropdownMenuItem>
              {!meetingType.is_default && (
                <DropdownMenuItem onClick={handleSetDefault}>
                  <Star className="w-4 h-4 mr-2" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(meetingType)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {meetingType.description && (
          <p className="text-sm text-muted-foreground">
            {meetingType.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{meetingType.duration_minutes} min</span>
            </div>
            <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
              /{meetingType.slug}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
