'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateMessageDto, createMessageSchema, type MessagePreview } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmojiClickData } from 'emoji-picker-react';
import { Paperclip, Send, Smile, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useChatActivity } from '@/components/app/chat-activity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

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

export function MessageComposer({
  conversationId,
  disabled: unavailable = false,
  reply,
  onReplyCleared,
}: {
  conversationId: string;
  disabled?: boolean;
  reply: MessagePreview | null;
  onReplyCleared: () => void;
}) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { sendTyping } = useChatActivity();
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [draftReady, setDraftReady] = useState(false);
  const disabled = unavailable || !draftReady;
  const [draftError, setDraftError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const { control, register, handleSubmit, reset, watch, formState, getValues, setValue, setError } = useForm<
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
  useEffect(() => {
    if (reply) inputRef.current?.focus();
  }, [reply?.id]);
  useEffect(() => {
    if (!user?.id) return;
    const key = `convo:draft:${user.id}:${conversationId}`;
    try {
      reset({ content: (sessionStorage.getItem(key) ?? '').slice(0, 10000) });
    } catch {
      setDraftError(text('Draft storage is unavailable. Keep this tab open to retain your text.'));
    }
    setDraftReady(true);
    const subscription = watch((values) => {
      try {
        if (values.content) sessionStorage.setItem(key, values.content);
        else sessionStorage.removeItem(key);
      } catch {
        setDraftError(text('Draft storage is unavailable. Keep this tab open to retain your text.'));
      }
    });
    return () => subscription.unsubscribe();
  }, [conversationId, user?.id, reset, watch, text]);
  useEffect(
    () => () => {
      clearTimeout(typingTimer.current);
      sendTyping(conversationId, false);
    },
    [conversationId, sendTyping],
  );
  function typingChanged(hasText: boolean) {
    clearTimeout(typingTimer.current);
    sendTyping(conversationId, hasText);
    if (hasText) typingTimer.current = setTimeout(() => sendTyping(conversationId, false), 3000);
  }
  const sendMessage = useMutation({
    mutationFn: (body: CreateMessageDto) =>
      apiRequest('messages', {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      reset({ content: '' });
      selection.current = null;
      setEmojiOpen(false);
      setSubmitError(null);
      onReplyCleared();
      typingChanged(false);
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
    if (disabled || sendMessage.isPending || uploading) return;
    setSubmitError(null);
    typingChanged(false);
    sendMessage.mutate({
      conversation_id: conversationId,
      type: 'text',
      content,
      ...(reply ? { reply_to_id: reply.id } : {}),
    });
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
    typingChanged(true);
    const cursor = start + emoji.length;
    selection.current = { start: cursor, end: cursor };
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  async function uploadFile(file: File) {
    if (disabled || uploading || sendMessage.isPending) return;
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
    if (reply) formData.append('reply_to_id', reply.id);
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

    onReplyCleared();
    typingChanged(false);
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
      {reply && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-l-4 border-primary bg-primary/5 p-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{text('Replying to {name}', { name: reply.sender.name })}</p>
            <p className="truncate text-muted-foreground">{reply.content || text('Shared attachment')}</p>
          </div>
          <Button
            aria-label={text('Cancel reply')}
            disabled={uploading || sendMessage.isPending}
            size="icon-sm"
            variant="ghost"
            onClick={onReplyCleared}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      {draftError && (
        <p role="alert" className="mb-2 text-xs text-destructive">
          {draftError}
        </p>
      )}
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
          onChange={(event) => {
            void contentRegistration.onChange(event);
            typingChanged(Boolean(event.target.value.trim()));
          }}
          onBlur={(event) => {
            void contentRegistration.onBlur(event);
            typingChanged(false);
          }}
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
          disabled={disabled || !draftReady || !messageText || sendMessage.isPending || uploading}
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
