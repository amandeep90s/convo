'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';

export function DeleteChatDialog({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (pending || deleted) return;
    setPending(true);
    setError(null);
    try {
      await apiRequest(`conversations/${conversationId}/everyone`, { method: 'DELETE' });
      setDeleted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('Could not delete this chat.'));
      setPending(false);
      return;
    }
    queryClient.removeQueries({ queryKey: ['messages', conversationId] });
    queryClient.removeQueries({ queryKey: ['conversation', conversationId] });
    queryClient.removeQueries({ queryKey: ['pinned-messages', conversationId] });
    queryClient.removeQueries({ queryKey: ['message-preview', conversationId] });
    if (pathname === `/chat/${conversationId}`) router.replace('/chat');
    try {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onClose();
    } catch (reason) {
      setError(
        text('Chat deleted, but the chat list could not refresh. {value0}', {
          value0: reason instanceof Error ? reason.message : text('Refresh the page.'),
        }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{text('Delete chat for everyone?')}</AlertDialogTitle>
        <AlertDialogDescription>
          {text('This removes the chat and its message history for every participant. This cannot be undone.')}
        </AlertDialogDescription>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {text(error)}
          </p>
        )}
        <AlertDialogFooter>
          <Button disabled={pending} onClick={onClose} variant="outline">
            {deleted ? text('Close') : text('Cancel')}
          </Button>
          <Button disabled={pending || deleted} onClick={() => void remove()} variant="destructive">
            {pending ? text('Deleting…') : text('Delete chat')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
