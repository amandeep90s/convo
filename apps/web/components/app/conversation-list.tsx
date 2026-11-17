'use client';

import type { ConversationListResponse } from '@repo/shared';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, MessageCircle, MoreHorizontal, Search, Star, StarOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { DeleteChatDialog } from '@/components/app/delete-chat-dialog';
import { GroupCreator } from '@/components/app/group-creator';
import { PresenceStatus } from '@/components/app/presence-status';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type ConversationMode = 'recent' | 'archived' | 'starred';

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
  const [deletingChat, setDeletingChat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();
  const copy = viewCopy[mode];
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: ['conversations', mode, searchTerm],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: '50' });
      if (searchTerm) params.set('q', searchTerm);
      if (mode === 'archived') params.set('archived', 'true');
      if (mode === 'starred') params.set('starred', 'true');
      return apiRequest<ConversationListResponse>(`conversations?${params}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    retry: false,
    refetchInterval: 30000,
  });
  const conversations = [
    ...new Map(
      query.data?.pages.flatMap((page) => page.data).map((conversation) => [conversation.id, conversation]),
    ).values(),
  ];

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
          maxLength={100}
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
      {deletingChat && <DeleteChatDialog conversationId={deletingChat} onClose={() => setDeletingChat(null)} />}
      {query.isPending && <ListMessage>{text('Loading conversations…')}</ListMessage>}
      {query.isError && (
        <ListMessage role="alert">
          {text('Could not load conversations.')} {text(query.error.message)}
          <Button
            className="mt-3"
            disabled={query.isFetching}
            onClick={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
            variant="outline"
          >
            {text('Try again')}
          </Button>
        </ListMessage>
      )}
      {query.isSuccess && conversations.length === 0 && (
        <ListMessage>{text(searchTerm ? 'No conversations match your search.' : copy.empty)}</ListMessage>
      )}

      {conversations.length > 0 && (
        <section aria-label={text(copy.title)} className="min-h-0 overflow-y-auto">
          {conversations.map((conversation) => {
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
                className={`relative px-3 transition-colors hover:bg-muted/70 ${pathname === `/chat/${conversation.id}` ? 'bg-muted' : ''}`}
                key={conversation.id}
              >
                <Link
                  className="flex min-w-0 items-center gap-3 rounded-sm py-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  href={`/chat/${conversation.id}`}
                >
                  <Avatar className="size-12">
                    {participant?.avatar_url && conversation.type === 'private' && (
                      <AvatarImage alt="" src={participant.avatar_url} />
                    )}
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                      {title.charAt(0).toUpperCase()}
                    </AvatarFallback>
                    {conversation.type === 'private' && <PresenceStatus presence={participant?.presence ?? null} />}
                  </Avatar>
                  <span className="min-w-0 flex-1 pr-9">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate ${conversation.unread_count > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {title}
                      </span>
                      {message && (
                        <time
                          className={`shrink-0 text-[11px] tabular-nums ${conversation.unread_count > 0 ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                          dateTime={message.created_at}
                        >
                          {formatDate(message.created_at, locale)}
                        </time>
                      )}
                    </span>
                    <span className="mt-1 flex min-h-6 items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span className="truncate">
                        {message?.content || (message ? text('Attachment or shared content') : text('No messages yet'))}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {starred && (
                          <Star
                            aria-label={text('Starred conversations')}
                            className="size-3 fill-current text-amber-500"
                          />
                        )}
                        {conversation.unread_count > 0 && (
                          <span
                            aria-label={text('{count, plural, one {# unread message} other {# unread messages}}', {
                              count: conversation.unread_count,
                            })}
                            className="min-w-5 shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-center text-xs font-semibold text-primary-foreground"
                          >
                            {new Intl.NumberFormat(locale).format(conversation.unread_count)}
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        aria-label={text('Conversation actions')}
                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full text-muted-foreground"
                        disabled={actionId === conversation.id}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="min-w-48 rounded-xl">
                    {(conversation.type === 'private' || ownMembership?.role === 'admin') && (
                      <DropdownMenuItem variant="destructive" onClick={() => setDeletingChat(conversation.id)}>
                        <Trash2 aria-hidden="true" />
                        {text('Delete chat')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      disabled={actionId === conversation.id}
                      onClick={() => void updateConversation(conversation.id, starred ? 'unstar' : 'star')}
                    >
                      {starred ? <StarOff aria-hidden="true" /> : <Star aria-hidden="true" />}
                      {starred ? text('Unstar conversation') : text('Star conversation')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={actionId === conversation.id}
                      onClick={() => void updateConversation(conversation.id, archived ? 'restore' : 'archive')}
                    >
                      {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
                      {archived ? text('Restore conversation') : text('Archive conversation')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
          {query.hasNextPage && (
            <div className="p-4 text-center">
              <Button disabled={query.isFetching} onClick={() => void query.fetchNextPage()} variant="outline">
                {query.isFetchingNextPage ? text('Loading…') : text('Load more conversations')}
              </Button>
            </div>
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
