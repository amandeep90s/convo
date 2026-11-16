'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, MessageCircle, Star, StarOff } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { GroupCreator } from '@/components/app/group-creator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type ConversationMode = 'recent' | 'archived' | 'starred';
type ConversationListResponse = { data: Conversation[]; total: number };
type Conversation = {
  id: string;
  name: string | null;
  type: string;
  last_message_at: string | null;
  members: Array<{
    user_id: string;
    archived_at: string | null;
    starred_at: string | null;
    user: { id: string; name: string; username: string; avatar_url: string | null };
  }>;
  messages: Array<{ id: string; type: string; content: string | null; created_at: string }>;
};

const viewCopy: Record<ConversationMode, { title: string; description: string; empty: string }> = {
  recent: {
    title: 'Your conversations',
    description: 'Pick up where you left off or start a conversation with someone new.',
    empty: 'Your conversation list is empty. Add a contact to start a chat.',
  },
  archived: {
    title: 'Archived conversations',
    description: 'Conversations you have archived stay here until you restore them.',
    empty: 'You do not have any archived conversations.',
  },
  starred: {
    title: 'Starred conversations',
    description: 'Keep important conversations close at hand.',
    empty: 'Star a conversation to find it here.',
  },
};

export function ConversationList({ mode }: { mode: ConversationMode }) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = viewCopy[mode];
  const query = useQuery({
    queryKey: ['conversations', mode],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (mode === 'archived') params.set('archived', 'true');
      if (mode === 'starred') params.set('starred', 'true');
      return apiRequest<ConversationListResponse>(`conversations?${params}`);
    },
    retry: false,
  });

  async function updateConversation(id: string, action: 'archive' | 'restore' | 'star' | 'unstar') {
    setActionId(id);
    setError(null);
    try {
      const method = action === 'archive' || action === 'star' ? 'POST' : 'DELETE';
      const resource = action === 'archive' || action === 'restore' ? 'archive' : 'star';
      await apiRequest(`conversations/${id}/${resource}`, { method });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Could not update this conversation.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        {mode === 'recent' && (
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/contacts" />}>
              <MessageCircle aria-hidden="true" />
              New conversation
            </Button>
            <GroupCreator />
          </div>
        )}
      </header>

      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {query.isPending && <ListMessage>Loading conversations…</ListMessage>}
      {query.isError && <ListMessage role="alert">Could not load conversations. {query.error.message}</ListMessage>}
      {query.isSuccess && query.data.data.length === 0 && <ListMessage>{copy.empty}</ListMessage>}

      {query.isSuccess && query.data.data.length > 0 && (
        <section aria-label={copy.title} className="flex flex-col gap-3">
          {query.data.data.map((conversation) => {
            const ownMembership = conversation.members.find((member) => member.user_id === user?.id);
            const participant = user
              ? conversation.members.find((member) => member.user_id !== user.id)?.user
              : undefined;
            const title =
              conversation.name ||
              participant?.name ||
              (conversation.type === 'private' ? 'Direct message' : 'Group conversation');
            const message = conversation.messages[0];
            const starred = Boolean(ownMembership?.starred_at);
            const archived = Boolean(ownMembership?.archived_at);
            return (
              <Card className="transition-colors hover:bg-muted/20" key={conversation.id}>
                <CardContent className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    className="min-w-0 flex-1 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={`/chat/${conversation.id}`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {title}
                      {starred && <Star aria-label="Starred" className="size-3.5 fill-current text-amber-500" />}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {message?.content || (message ? 'Attachment or shared content' : 'No messages yet')}
                    </span>
                    {participant && conversation.type === 'private' && (
                      <span className="mt-1 block text-xs text-muted-foreground">@{participant.username}</span>
                    )}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      aria-label={starred ? 'Unstar conversation' : 'Star conversation'}
                      disabled={actionId === conversation.id}
                      onClick={() => void updateConversation(conversation.id, starred ? 'unstar' : 'star')}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      {starred ? <StarOff aria-hidden="true" /> : <Star aria-hidden="true" />}
                    </Button>
                    <Button
                      aria-label={archived ? 'Restore conversation' : 'Archive conversation'}
                      disabled={actionId === conversation.id}
                      onClick={() => void updateConversation(conversation.id, archived ? 'restore' : 'archive')}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
                    </Button>
                    <time className="hidden text-xs text-muted-foreground lg:block" dateTime={message?.created_at}>
                      {message ? formatDate(message.created_at) : ''}
                    </time>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}

function ListMessage({ children, role }: { children: ReactNode; role?: 'alert' }) {
  return (
    <p className="rounded-xl border bg-background px-5 py-10 text-center text-sm text-muted-foreground" role={role}>
      {children}
    </p>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
