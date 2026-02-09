'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { disconnectAccount, setDefaultAccount } from '@/lib/actions/calendar';
import { toast } from 'sonner';
import Link from 'next/link';
import { Calendar, Star, Trash2 } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  email: string;
  is_default: boolean;
  created_at: string;
}

interface CalendarConnectionsProps {
  accounts: ConnectedAccount[];
  calendarLimit: number;
}

export function CalendarConnections({ accounts, calendarLimit }: CalendarConnectionsProps) {
  const [isPending, startTransition] = useTransition();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const canAddMore = accounts.length < calendarLimit;

  const handleSetDefault = (accountId: string) => {
    startTransition(async () => {
      const result = await setDefaultAccount(accountId);
      if (result.success) {
        toast.success('Default calendar updated');
      } else {
        toast.error(result.error || 'Failed to set default');
      }
    });
  };

  const handleDisconnect = () => {
    if (!selectedAccountId) return;

    setDisconnectingId(selectedAccountId);
    startTransition(async () => {
      const result = await disconnectAccount(selectedAccountId);
      if (result.success) {
        toast.success('Calendar disconnected');
        setDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to disconnect');
      }
      setDisconnectingId(null);
      setSelectedAccountId(null);
    });
  };

  const openDisconnectDialog = (accountId: string) => {
    setSelectedAccountId(accountId);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Connected Calendars
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync events and create meetings automatically.
          {calendarLimit !== Infinity && (
            <span className="ml-1">
              ({accounts.length}/{calendarLimit} used)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No calendars connected</p>
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to get started
              </p>
            </div>
            <Button asChild>
              <Link href="/api/calendar/connect">Connect Google Calendar</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <div className="flex items-center gap-2">
                        {account.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Connected {new Date(account.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        disabled={isPending}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDisconnectDialog(account.id)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {canAddMore && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/api/calendar/connect">
                  Connect Another Calendar
                </Link>
              </Button>
            )}

            {!canAddMore && (
              <div className="text-center py-4 px-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You've reached your calendar limit.{' '}
                  <Link href="/pricing" className="text-primary hover:underline">
                    Upgrade your plan
                  </Link>{' '}
                  to connect more calendars.
                </p>
              </div>
            )}
          </>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disconnect Calendar</DialogTitle>
              <DialogDescription>
                Are you sure you want to disconnect this calendar? This will remove the calendar
                sync and you won't be able to create calendar events for new bookings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={!!disconnectingId}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={!!disconnectingId}
              >
                {disconnectingId ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
