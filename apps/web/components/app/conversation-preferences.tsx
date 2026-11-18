'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ChatConversation, updateConversationMemberSchema, updateConversationSchema } from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';

const expirySchema = updateConversationSchema.pick({ disappearing_message_ttl_seconds: true });
const notificationsSchema = updateConversationMemberSchema.pick({ notification_policy: true });

export function ConversationPreferences({
  conversation,
  userId,
  onClose,
}: {
  conversation: ChatConversation;
  userId: string;
  onClose: () => void;
}) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const membership = conversation.members.find((member) => member.user_id === userId);
  const canChangeExpiry = conversation.type === 'private' || membership?.role === 'admin';
  const expiry = useForm<z.input<typeof expirySchema>, unknown, z.output<typeof expirySchema>>({
    resolver: zodResolver(expirySchema),
    defaultValues: { disappearing_message_ttl_seconds: conversation.disappearing_message_ttl_seconds ?? null },
  });
  const notifications = useForm<z.input<typeof notificationsSchema>, unknown, z.output<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: { notification_policy: membership?.notification_policy ?? 'all' },
  });
  const ttl = conversation.disappearing_message_ttl_seconds;
  const customTtl = ttl && ![86400, 604800, 7776000].includes(ttl);

  async function saveExpiry(body: z.output<typeof expirySchema>) {
    try {
      await apiRequest(`conversations/${conversation.id}`, { method: 'PATCH', body });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
    } catch (reason) {
      expiry.setError('root', {
        message: reason instanceof Error ? reason.message : text('Could not update this conversation.'),
      });
    }
  }
  async function saveNotifications(body: z.output<typeof notificationsSchema>) {
    try {
      await apiRequest(`conversation-members/${conversation.id}/${userId}`, { method: 'PATCH', body });
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
    } catch (reason) {
      notifications.setError('root', {
        message: reason instanceof Error ? reason.message : text('Could not update this conversation.'),
      });
    }
  }
  const selectClass = 'h-11 w-full rounded-xl border bg-background px-3 text-sm';

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-3xl">
        <div>
          <DialogTitle>{text('Chat preferences')}</DialogTitle>
          <DialogDescription>{text('Choose how this conversation behaves.')}</DialogDescription>
        </div>
        <form className="space-y-3" onSubmit={expiry.handleSubmit(saveExpiry)}>
          <label className="grid gap-2 text-sm font-medium">
            {text('Disappearing messages')}
            <select
              className={selectClass}
              disabled={!canChangeExpiry || expiry.formState.isSubmitting}
              {...expiry.register('disappearing_message_ttl_seconds', {
                setValueAs: (value) => (value === '' || value == null ? null : Number(value)),
              })}
            >
              <option value="">{text('Off')}</option>
              <option value="86400">{text('24 hours')}</option>
              <option value="604800">{text('7 days')}</option>
              <option value="7776000">{text('90 days')}</option>
              {customTtl && <option value={ttl}>{text('Custom: {seconds} seconds', { seconds: ttl })}</option>}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            {text(
              'Applies to new messages for everyone. Expired messages are hidden, not permanently erased from storage.',
            )}
          </p>
          {!canChangeExpiry && <p className="text-xs">{text('Only admins can change this setting in groups.')}</p>}
          {expiry.formState.errors.disappearing_message_ttl_seconds && (
            <p role="alert" className="text-xs text-destructive">
              {text('Choose a valid message lifetime.')}
            </p>
          )}
          {expiry.formState.errors.root && (
            <p role="alert" className="text-xs text-destructive">
              {expiry.formState.errors.root.message}
            </p>
          )}
          {expiry.formState.isSubmitSuccessful && !expiry.formState.errors.root && (
            <p role="status" className="text-xs text-primary">
              {text('Saved')}
            </p>
          )}
          <Button type="submit" disabled={!canChangeExpiry || expiry.formState.isSubmitting}>
            {text('Save message lifetime')}
          </Button>
        </form>
        <form className="space-y-3 border-t pt-4" onSubmit={notifications.handleSubmit(saveNotifications)}>
          <label className="grid gap-2 text-sm font-medium">
            {text('Notifications')}
            <select
              className={selectClass}
              disabled={notifications.formState.isSubmitting}
              {...notifications.register('notification_policy')}
            >
              <option value="all">{text('All messages')}</option>
              {(conversation.type !== 'private' || membership?.notification_policy === 'mentions_only') && (
                <option value="mentions_only">{text('Mentions only')}</option>
              )}
              <option value="none">{text('Muted')}</option>
            </select>
          </label>
          {membership?.muted_until && Date.parse(membership.muted_until) > Date.now() && (
            <p className="text-xs text-muted-foreground">{text('A timed mute is also active and takes priority.')}</p>
          )}
          {notifications.formState.errors.root && (
            <p role="alert" className="text-xs text-destructive">
              {notifications.formState.errors.root.message}
            </p>
          )}
          {notifications.formState.isSubmitSuccessful && !notifications.formState.errors.root && (
            <p role="status" className="text-xs text-primary">
              {text('Saved')}
            </p>
          )}
          <Button type="submit" disabled={notifications.formState.isSubmitting}>
            {text('Save notifications')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
