'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateMessageDto, createMessageSchema } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, apiRequest } from '@/lib/client/api';

type CreatedMessage = { id: string };
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const supportedFiles: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'application/pdf': 'document',
  'text/plain': 'document',
};

const messageFormSchema = createMessageSchema.pick({ content: true }).extend({
  content: z.string().trim().min(1, 'Write a message before sending.').max(10000),
});

export function MessageComposer({ conversationId, disabled = false }: { conversationId: string; disabled?: boolean }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const { control, register, handleSubmit, reset, formState } = useForm<
    z.input<typeof messageFormSchema>,
    unknown,
    z.output<typeof messageFormSchema>
  >({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { content: '' },
  });
  const messageText = useWatch({ control, name: 'content' }) ?? '';
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const sendMessage = useMutation({
    mutationFn: (body: CreateMessageDto) =>
      apiRequest('messages', {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      reset();
      setSubmitError(null);
      try {
        await refreshConversationQueries();
      } catch (refreshError) {
        setSubmitError(
          `Message sent, but the conversation could not refresh. ${toMessage(refreshError, 'Refresh the page to see it.')}`,
        );
      }
    },
    onError: (error) => setSubmitError(toMessage(error, 'Could not send this message.')),
  });

  function submitMessage({ content }: z.output<typeof messageFormSchema>) {
    if (sendMessage.isPending || uploading) return;
    setSubmitError(null);
    sendMessage.mutate({ conversation_id: conversationId, type: 'text', content });
  }

  async function uploadFile(file: File) {
    const type = supportedFiles[file.type];
    if (!type) {
      setSubmitError(
        'This file type is not supported. Choose an image, MP4 video, supported audio file, PDF, or text file.',
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setSubmitError('Files must be 20 MB or smaller.');
      return;
    }

    setUploading(true);
    setSubmitError(null);
    let message: CreatedMessage;
    try {
      const body: CreateMessageDto = { conversation_id: conversationId, type, content: file.name };
      message = await apiRequest<CreatedMessage>('messages', {
        method: 'POST',
        body,
      });
    } catch (error) {
      setSubmitError(toMessage(error, 'Could not prepare the attachment.'));
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiRequest(`message-attachments/upload/${message.id}`, { method: 'POST', body: formData });
    } catch (uploadError) {
      let failureMessage: string;
      try {
        await apiRequest(`messages/${message.id}`, { method: 'DELETE' });
        failureMessage = `Upload failed and the unsent message was removed. ${toMessage(uploadError, 'Please try again.')}`;
      } catch (cleanupError) {
        failureMessage = `Upload failed (${toMessage(uploadError, 'unknown error')}). The draft message could not be removed (${toMessage(cleanupError, 'unknown error')}).`;
      }
      await refreshConversationQueries();
      setSubmitError(failureMessage);
      setUploading(false);
      return;
    }

    try {
      await refreshConversationQueries();
    } catch (refreshError) {
      setSubmitError(
        `Attachment uploaded, but the conversation could not refresh. ${toMessage(refreshError, 'Refresh the page to see it.')}`,
      );
    } finally {
      setUploading(false);
    }
  }

  async function refreshConversationQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    ]);
  }

  return (
    <div>
      {submitError && (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
      {formState.errors.content?.message && (
        <p className="mb-2 text-xs text-destructive" id="message-content-error" role="alert">
          {formState.errors.content.message}
        </p>
      )}
      <form className="flex items-end gap-2" onSubmit={handleSubmit(submitMessage)}>
        <input
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,audio/mpeg,audio/ogg,audio/wav,application/pdf,text/plain"
          className="sr-only"
          disabled={disabled || uploading || sendMessage.isPending}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void uploadFile(file);
          }}
          ref={fileInput}
          type="file"
        />
        <Button
          aria-label="Attach a file"
          disabled={disabled || uploading || sendMessage.isPending}
          onClick={() => fileInput.current?.click()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Paperclip aria-hidden="true" />
        </Button>
        <Input
          aria-label="Write a message"
          aria-invalid={Boolean(formState.errors.content)}
          aria-describedby={formState.errors.content ? 'message-content-error' : undefined}
          autoComplete="off"
          className="h-11 rounded-2xl border border-border/70 bg-background shadow-sm"
          disabled={disabled || uploading}
          maxLength={10000}
          placeholder={uploading ? 'Uploading attachment…' : 'Write a message…'}
          {...register('content')}
        />
        <Button
          aria-label="Send message"
          className="size-11 rounded-full bg-gradient-to-br from-[#087e64] to-[#12a178] text-white shadow-lg shadow-primary/20 hover:brightness-105"
          disabled={disabled || !messageText || sendMessage.isPending || uploading}
          size="icon"
          type="submit"
        >
          <Send aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
