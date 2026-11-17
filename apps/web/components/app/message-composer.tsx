'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateMessageDto, createMessageSchema } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmojiClickData } from 'emoji-picker-react';
import { Paperclip, Send, Smile } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';

const ChatEmojiPicker = dynamic(() => import('@/components/app/chat-emoji-picker'), { ssr: false });
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
  const text = useUiText();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const { control, register, handleSubmit, reset, formState, getValues, setValue, setError } = useForm<
    z.input<typeof messageFormSchema>,
    unknown,
    z.output<typeof messageFormSchema>
  >({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { content: '' },
  });
  const messageText = useWatch({ control, name: 'content' }) ?? '';
  const contentRegistration = register('content');
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
      selection.current = null;
      setEmojiOpen(false);
      setSubmitError(null);
      try {
        await refreshConversationQueries();
      } catch (refreshError) {
        setSubmitError(
          text('Message sent, but the conversation could not refresh. {value0}', {
            value0: toMessage(refreshError, 'Refresh the page to see it.'),
          }),
        );
      }
    },
    onError: (error) => setSubmitError(toMessage(error, text('Could not send this message.'))),
  });

  function submitMessage({ content }: z.output<typeof messageFormSchema>) {
    if (sendMessage.isPending || uploading) return;
    setSubmitError(null);
    sendMessage.mutate({ conversation_id: conversationId, type: 'text', content });
  }

  function insertEmoji({ emoji }: EmojiClickData) {
    if (disabled || uploading || sendMessage.isPending) return;
    const current = getValues('content');
    const start = selection.current?.start ?? current.length;
    const end = selection.current?.end ?? start;
    const value = current.slice(0, start) + emoji + current.slice(end);
    if (value.length > 10000) {
      setError('content', { type: 'maxLength', message: text('Messages must be 10,000 characters or fewer.') });
      return;
    }
    setValue('content', value, { shouldDirty: true, shouldValidate: true });
    const cursor = start + emoji.length;
    selection.current = { start: cursor, end: cursor };
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  async function uploadFile(file: File) {
    const type = supportedFiles[file.type];
    if (!type) {
      setSubmitError(
        text('This file type is not supported. Choose an image, MP4 video, supported audio file, PDF, or text file.'),
      );
      return;
    }
    if (file.size < 1 || file.size > MAX_FILE_BYTES) {
      setSubmitError(text('Files must be between 1 byte and 20 MB'));
      return;
    }

    setUploading(true);
    setSubmitError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiRequest(`message-attachments/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch (uploadError) {
      setSubmitError(toMessage(uploadError, text('Could not send this attachment. Check the chat before retrying.')));
      setUploading(false);
      return;
    }

    try {
      await refreshConversationQueries();
    } catch (refreshError) {
      setSubmitError(
        text('Attachment uploaded, but the conversation could not refresh. {value0}', {
          value0: toMessage(refreshError, 'Refresh the page to see it.'),
        }),
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
          {text(submitError)}
        </p>
      )}
      {formState.errors.content?.message && (
        <p className="mb-2 text-xs text-destructive" id="message-content-error" role="alert">
          {text(formState.errors.content.message)}
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
          aria-label={text('Attach a file')}
          disabled={disabled || uploading || sendMessage.isPending}
          onClick={() => fileInput.current?.click()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Paperclip aria-hidden="true" />
        </Button>
        <Popover open={emojiOpen && !disabled && !uploading && !sendMessage.isPending} onOpenChange={setEmojiOpen}>
          <PopoverTrigger
            render={
              <Button
                aria-label={text('Add emoji')}
                disabled={disabled || uploading || sendMessage.isPending}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Smile aria-hidden="true" />
              </Button>
            }
          />
          <PopoverContent
            finalFocus={inputRef}
            align="start"
            side="top"
            className="w-[min(350px,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl p-0"
          >
            <PopoverTitle className="sr-only">{text('Add emoji')}</PopoverTitle>
            {emojiOpen && <ChatEmojiPicker onEmojiClick={insertEmoji} />}
          </PopoverContent>
        </Popover>
        <Input
          aria-label={text('Write a message')}
          aria-invalid={Boolean(formState.errors.content)}
          aria-describedby={formState.errors.content ? 'message-content-error' : undefined}
          autoComplete="off"
          className="h-11 rounded-2xl border border-border/70 bg-background shadow-sm"
          disabled={disabled || uploading || sendMessage.isPending}
          maxLength={10000}
          placeholder={uploading ? text('Uploading attachment…') : text('Write a message…')}
          {...contentRegistration}
          ref={(node) => {
            contentRegistration.ref(node);
            inputRef.current = node;
          }}
          onSelect={(event) => {
            selection.current = {
              start: event.currentTarget.selectionStart ?? messageText.length,
              end: event.currentTarget.selectionEnd ?? messageText.length,
            };
          }}
        />
        <Button
          aria-label={text('Send message')}
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
