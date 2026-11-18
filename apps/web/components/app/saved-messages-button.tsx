'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';

export function SavedMessagesButton() {
  const text = useUiText();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function open() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await apiRequest<{ conversation_id: string }>('private-conversations/saved', { method: 'POST' });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/chat/${result.conversation_id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('Could not open Saved Messages.'));
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        aria-label={text('Saved Messages')}
        size="icon"
        variant="ghost"
        disabled={pending}
        onClick={() => void open()}
      >
        <Bookmark aria-hidden="true" />
      </Button>
      {error && (
        <p role="alert" className="max-w-44 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
