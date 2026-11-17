'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type DeleteMessageParams,
  MESSAGE_EDIT_WINDOW_MS,
  type UpdateMessageDto,
  updateMessageSchema,
} from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';

type ActionMessage = { id: string; content: string | null; type: string; created_at: string };

export function MessageActions({
  message,
  conversationId,
  own,
  canDeleteForEveryone,
}: {
  message: ActionMessage;
  conversationId: string;
  own: boolean;
  canDeleteForEveryone: boolean;
}) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<DeleteMessageParams['scope'] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const deadline = new Date(message.created_at).getTime() + MESSAGE_EDIT_WINDOW_MS;
  const canEdit = own && message.type === 'text' && now < deadline;
  const form = useForm<UpdateMessageDto>({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: { content: message.content ?? '' },
  });

  useEffect(() => {
    if (!canEdit) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [canEdit, deadline]);

  async function change(method: 'PATCH' | 'DELETE', body?: UpdateMessageDto) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const suffix = method === 'DELETE' ? `?scope=${deleting}` : '';
      await apiRequest(`messages/${message.id}${suffix}`, { method, ...(body ? { body } : {}) });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('Could not update this message.'));
      setPending(false);
      return;
    }
    setEditing(false);
    setDeleting(null);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('Message changed, but the chat could not refresh.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={text('Message actions')}
              size="icon-sm"
              variant="ghost"
              className="-mr-1 size-6 shrink-0 text-inherit"
              disabled={pending}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
          {canEdit && (
            <DropdownMenuItem
              onClick={() => {
                form.reset({ content: message.content ?? '' });
                setError(null);
                setEditing(true);
              }}
            >
              <Pencil aria-hidden="true" />
              {text('Edit message')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setError(null);
              setDeleting('me');
            }}
          >
            <Trash2 aria-hidden="true" />
            {text('Delete for me')}
          </DropdownMenuItem>
          {canDeleteForEveryone && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setError(null);
                setDeleting('everyone');
              }}
            >
              <Trash2 aria-hidden="true" />
              {text('Delete for everyone')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && !editing && !deleting && (
        <span role="alert" className="text-xs text-destructive">
          {text(error)}
        </span>
      )}
      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (!pending) setEditing(open);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogTitle>{text('Edit message')}</DialogTitle>
          <DialogDescription>
            {text('You can edit your own text messages for 15 minutes after sending.')}
          </DialogDescription>
          <form onSubmit={form.handleSubmit((value) => change('PATCH', value))} className="grid gap-4">
            <Input
              aria-label={text('Message text')}
              aria-invalid={Boolean(form.formState.errors.content)}
              maxLength={10000}
              disabled={pending || !canEdit}
              {...form.register('content')}
            />
            {form.formState.errors.content?.message && (
              <p role="alert" className="text-sm text-destructive">
                {text(form.formState.errors.content.message)}
              </p>
            )}
            {!canEdit && (
              <p role="alert" className="text-sm text-destructive">
                {text('The 15-minute edit window has ended.')}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {text(error)}
              </p>
            )}
            <DialogFooter>
              <Button type="button" disabled={pending} variant="outline" onClick={() => setEditing(false)}>
                {text('Cancel')}
              </Button>
              <Button type="submit" disabled={pending || !canEdit}>
                {pending ? text('Saving…') : text('Save changes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{text('Delete message?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deleting === 'everyone'
              ? text(
                  'This message and its attachments will be permanently deleted for everyone. This cannot be undone.',
                )
              : text('This message will be removed only for you. Other participants will still see it.')}
          </AlertDialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {text(error)}
            </p>
          )}
          <AlertDialogFooter>
            <Button disabled={pending} onClick={() => setDeleting(null)} variant="outline">
              {text('Cancel')}
            </Button>
            <Button disabled={pending} onClick={() => void change('DELETE')} variant="destructive">
              {pending ? text('Deleting…') : text('Delete message')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
