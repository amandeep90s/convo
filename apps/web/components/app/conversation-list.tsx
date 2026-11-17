'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, MessageCircle, Search, Star, StarOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { GroupCreator } from '@/components/app/group-creator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiText } from '@/i18n/ui-text';
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
  const text = useUiText();
  const locale = useLocale();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const pathname = usePathname();
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
    refetchInterval: 30000,
  });
  const filteredConversations =
    query.data?.data.filter((conversation) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      const participant = user ? conversation.members.find((member) => member.user_id !== user.id)?.user : undefined;
      return [conversation.name, participant?.name, participant?.username].some((value) =>
        value?.toLowerCase().includes(term),
      );
    }) ?? [];

  async function updateConversation(id: string, action: 'archive' | 'restore' | 'star' | 'unstar') {
    setActionId(id);
    setError(null);
    try {
      const method = action === 'archive' || action === 'star' ? 'POST' : 'DELETE';
      const resource = action === 'archive' || action === 'restore' ? 'archive' : 'star';
      await apiRequest(`conversations/${id}/${resource}`, { method });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : text('Could not update this conversation.'));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className={`mx-auto flex min-h-0 w-full flex-col ${mode === 'recent' ? 'h-full' : 'max-w-5xl'}`}>
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'recent' ? text('Chats') : text(copy.title)}
          </h1>
          {mode !== 'recent' && <p className="mt-2 text-sm text-muted-foreground">{text(copy.description)}</p>}
        </div>
        {mode === 'recent' && (
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={text('New conversation')}
              nativeButton={false}
              render={<Link href="/contacts" />}
              size="icon"
              variant="ghost"
            >
              <MessageCircle aria-hidden="true" />
            </Button>
            <GroupCreator />
          </div>
        )}
      </header>
      <div className="relative px-5 pb-3">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 left-8 size-4 text-muted-foreground"
        />
        <Input
          aria-label={text('Search conversations')}
          className="border-0 bg-muted pl-9 shadow-none"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={text('Search conversations')}
          value={search}
        />
      </div>

      {error && (
        <p
          className="mx-5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {text(error)}
        </p>
      )}
      {query.isPending && <ListMessage>{text('Loading conversations…')}</ListMessage>}
      {query.isError && (
        <ListMessage role="alert">
          {text('Could not load conversations.')} {text(query.error.message)}
        </ListMessage>
      )}
      {query.isSuccess && query.data.data.length === 0 && <ListMessage>{text(copy.empty)}</ListMessage>}

      {query.isSuccess && query.data.data.length > 0 && (
        <section aria-label={text(copy.title)} className="min-h-0 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const ownMembership = conversation.members.find((member) => member.user_id === user?.id);
            const participant = user
              ? conversation.members.find((member) => member.user_id !== user.id)?.user
              : undefined;
            const title =
              conversation.name ||
              participant?.name ||
              (conversation.type === 'private' ? text('Direct message') : text('Group conversation'));
            const message = conversation.messages[0];
            const starred = Boolean(ownMembership?.starred_at);
            const archived = Boolean(ownMembership?.archived_at);
            return (
              <div
                className={`flex items-center gap-1 px-3 transition-colors hover:bg-muted/70 ${pathname === `/chat/${conversation.id}` ? 'bg-muted' : ''}`}
                key={conversation.id}
              >
                <Link
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-sm py-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  href={`/chat/${conversation.id}`}
                >
                  <Avatar className="size-12">
                    {participant?.avatar_url && conversation.type === 'private' && (
                      <AvatarImage alt="" src={participant.avatar_url} />
                    )}
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                      {title.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{title}</span>
                      {message && (
                        <time className="shrink-0 text-xs text-muted-foreground" dateTime={message.created_at}>
                          {formatDate(message.created_at, locale)}
                        </time>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {message?.content || (message ? text('Attachment or shared content') : text('No messages yet'))}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center">
                  <Button
                    aria-label={starred ? text('Unstar conversation') : text('Star conversation')}
                    disabled={actionId === conversation.id}
                    onClick={() => void updateConversation(conversation.id, starred ? 'unstar' : 'star')}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {starred ? <StarOff aria-hidden="true" /> : <Star aria-hidden="true" />}
                  </Button>
                  <Button
                    aria-label={archived ? text('Restore conversation') : text('Archive conversation')}
                    disabled={actionId === conversation.id}
                    onClick={() => void updateConversation(conversation.id, archived ? 'restore' : 'archive')}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
                  </Button>
                </div>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
            <ListMessage>{text('No conversations match your search.')}</ListMessage>
          )}
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

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
