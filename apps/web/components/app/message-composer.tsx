'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Send } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

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

export function MessageComposer({ conversationId, disabled = false }: { conversationId: string; disabled?: boolean }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      apiRequest('messages', {
        method: 'POST',
        body: { conversation_id: conversationId, type: 'text', content },
      }),
    onSuccess: async () => {
      setMessageText('');
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

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = messageText.trim();
    if (!content || sendMessage.isPending || uploading) return;
    setSubmitError(null);
    await sendMessage.mutateAsync(content).catch(() => undefined);
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
      message = await apiRequest<CreatedMessage>('messages', {
        method: 'POST',
        body: { conversation_id: conversationId, type, content: file.name },
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
      <form className="flex items-end gap-2" onSubmit={submitMessage}>
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
          variant="outline"
        >
          <Paperclip aria-hidden="true" />
        </Button>
        <Input
          aria-label="Write a message"
          autoComplete="off"
          disabled={disabled || uploading}
          maxLength={10000}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder={uploading ? 'Uploading attachment…' : 'Write a message…'}
          value={messageText}
        />
        <Button
          aria-label="Send message"
          disabled={disabled || !messageText.trim() || sendMessage.isPending || uploading}
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
