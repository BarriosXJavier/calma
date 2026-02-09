'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface ShareLinkDialogProps {
  slug: string;
}

export function ShareLinkDialog({ slug }: ShareLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share Booking Link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your Booking Link</DialogTitle>
          <DialogDescription>
            Share this link with others to let them book time with you.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 mt-4">
          <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
            {bookingUrl}
          </code>
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
