'use client';

import type { CreateMessageReactionDto, TMessageReaction } from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import type { EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';

const ChatEmojiPicker = dynamic(() => import('@/components/app/chat-emoji-picker'), { ssr: false });

export function MessageReactions({
  messageId,
  conversationId,
  reactions,
  userId,
}: {
  messageId: string;
  conversationId: string;
  reactions: TMessageReaction[];
  userId: string;
}) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const own = reactions.find((reaction) => reaction.user_id === userId)?.emoji;
  const counts = new Map<string, number>();
  for (const reaction of reactions) counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
  async function react(emoji: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const body: CreateMessageReactionDto = { message_id: messageId, emoji };
      await apiRequest(`message-reactions/${messageId}`, {
        method: own === emoji ? 'DELETE' : 'POST',
        ...(own === emoji ? {} : { body }),
      });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('Could not update reaction.'));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {[...counts].map(([emoji, count]) => (
        <button
          key={emoji}
          type="button"
          disabled={pending}
          aria-pressed={own === emoji}
          aria-label={text('React with {emoji}', { emoji })}
          onClick={() => void react(emoji)}
          className={`rounded-full border px-2 py-0.5 text-xs ${own === emoji ? 'border-primary bg-primary/10' : 'border-current/15'}`}
        >
          {emoji} {count}
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label={text('React to message')}
              disabled={pending}
              size="icon-sm"
              variant="ghost"
              className="size-6"
            >
              <Smile className="size-3.5" aria-hidden="true" />
            </Button>
          }
        />
        <PopoverContent className="w-[min(350px,calc(100vw-2rem))] overflow-hidden p-0" align="start">
          <PopoverTitle className="sr-only">{text('React to message')}</PopoverTitle>
          {open && <ChatEmojiPicker onEmojiClick={({ emoji }: EmojiClickData) => void react(emoji)} />}
        </PopoverContent>
      </Popover>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {text(error)}
        </span>
      )}
    </div>
  );
}
