'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo } from 'react';

import { MemberManager } from '@/components/app/member-manager';
import { MessageComposer } from '@/components/app/message-composer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Person = { id: string; name: string; username: string; avatar_url: string | null };
type Conversation = {
  id: string;
  name: string | null;
  type: string;
  group: { name: string; description: string | null } | null;
  members: Array<{ user_id: string; role: string; user: Person }>;
};
type Message = {
  id: string;
  sender_id: string;
  type: string;
  content: string | null;
  created_at: string;
  sender: Person;
  attachments: Array<{ id: string; file_name: string | null; mime_type: string }>;
};
type MessagePage = { items: Message[]; nextCursor: string | null; hasMore: boolean };

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { data: currentUser } = useCurrentUser();

  const conversation = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => apiRequest<Conversation>(`conversations/${conversationId}`),
    retry: false,
  });
  const messages = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ conversationId, limit: '30' });
      if (pageParam) params.set('cursor', pageParam);
      return apiRequest<MessagePage>(`messages?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 10000,
    retry: false,
  });
  const orderedMessages = useMemo(
    () => messages.data?.pages.flatMap((page) => page.items).reverse() ?? [],
    [messages.data],
  );
  const otherMember = currentUser
    ? conversation.data?.members.find(({ user_id }) => user_id !== currentUser.id)?.user
    : undefined;
  const title =
    conversation.data?.group?.name ||
    conversation.data?.name ||
    otherMember?.name ||
    (conversation.data?.type === 'private' ? 'Direct message' : 'Conversation');

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <header className="flex items-center gap-3 border-b px-4 py-3 md:px-6">
        <Button aria-label="Back to conversations" render={<Link href="/chat" />} size="icon" variant="ghost">
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{conversation.isPending ? 'Loading conversation…' : title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {otherMember
              ? `@${otherMember.username}`
              : conversation.data
                ? `${conversation.data.members.length} members`
                : ''}
          </p>
        </div>
      </header>
      {conversation.data && conversation.data.type !== 'private' && (
        <div className="border-b px-4 py-3 md:px-6">
          <MemberManager conversationId={conversationId} members={conversation.data.members} />
        </div>
      )}

      <section
        aria-label="Messages"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 md:px-6"
      >
        {messages.isPending && <Status>Loading messages…</Status>}
        {messages.isError && <Status role="alert">Could not load messages. {messages.error.message}</Status>}
        {messages.isSuccess && orderedMessages.length === 0 && (
          <Status>No messages yet. Send the first message.</Status>
        )}
        {messages.isSuccess && orderedMessages.length > 0 && (
          <div className="mt-auto flex flex-col gap-3">
            {messages.hasNextPage && (
              <Button
                className="self-center"
                disabled={messages.isFetchingNextPage}
                onClick={() => void messages.fetchNextPage()}
                type="button"
                variant="outline"
              >
                <ArrowDown aria-hidden="true" />
                {messages.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
              </Button>
            )}
            {orderedMessages.map((message) => {
              const isOwn = message.sender_id === currentUser?.id;
              return (
                <article className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`} key={message.id}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    {!isOwn && <p className="mb-1 text-xs font-medium">{message.sender.name}</p>}
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.content || (message.attachments.length ? 'Shared attachment' : 'Shared content')}
                    </p>
                    {message.attachments.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {message.attachments.map((attachment) => (
                          <li key={attachment.id}>
                            <a
                              className={`text-xs underline underline-offset-2 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`}
                              href={`/api/backend/message-attachments/${attachment.id}/file`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {attachment.file_name || 'Download attachment'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    <time
                      className={`mt-1 block text-right text-[11px] ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                      dateTime={message.created_at}
                    >
                      {formatTime(message.created_at)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {conversation.isError && (
        <p className="border-t px-4 py-3 text-sm text-destructive" role="alert">
          Could not load this conversation. {conversation.error.message}
        </p>
      )}
      <footer className="border-t p-3 md:p-4">
        <MessageComposer conversationId={conversationId} disabled={conversation.isError || conversation.isPending} />
      </footer>
    </div>
  );
}

function Status({ children, role }: { children: ReactNode; role?: 'alert' }) {
  return (
    <Card className="my-auto items-center px-5 py-10 text-center text-sm text-muted-foreground" role={role}>
      {children}
    </Card>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
