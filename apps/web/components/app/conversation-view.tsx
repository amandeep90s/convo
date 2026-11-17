'use client';

import type { ChatParticipant, TMessageReceipt } from '@repo/shared';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, Check, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { DeleteChatDialog } from '@/components/app/delete-chat-dialog';
import { MemberManager } from '@/components/app/member-manager';
import { MessageActions } from '@/components/app/message-actions';
import { MessageComposer } from '@/components/app/message-composer';
import { PresenceStatus } from '@/components/app/presence-status';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Conversation = {
  id: string;
  name: string | null;
  type: string;
  group: { name: string; description: string | null } | null;
  members: Array<{ user_id: string; role: string; user: ChatParticipant }>;
};
type Message = {
  id: string;
  sender_id: string;
  type: string;
  content: string | null;
  created_at: string;
  edited_at?: string | null;
  sender: Omit<ChatParticipant, 'presence'>;
  attachments: Array<{ id: string; file_name: string | null; mime_type: string }>;
  receipts: TMessageReceipt[];
};
type MessagePage = { items: Message[]; nextCursor: string | null; hasMore: boolean };

export function ConversationView({ conversationId }: { conversationId: string }) {
  const text = useUiText();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [isVisible, setIsVisible] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const acknowledged = useRef(new Set<string>());
  const receiptQueue = useRef(Promise.resolve());
  const messageViewport = useRef<HTMLElement>(null);
  const nearBottom = useRef(true);
  const previousLatest = useRef<{ conversationId: string; messageId: string | undefined } | null>(null);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState === 'visible');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  const conversation = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => apiRequest<Conversation>(`conversations/${conversationId}`),
    retry: false,
    refetchInterval: 30000,
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
  useLayoutEffect(() => {
    if (!messages.isSuccess) return;
    const viewport = messageViewport.current;
    if (!viewport) return;
    const latest = orderedMessages.at(-1);
    const initialLoad = previousLatest.current?.conversationId !== conversationId;
    const newMessage = latest?.id !== previousLatest.current?.messageId;
    if (initialLoad || (newMessage && (nearBottom.current || latest?.sender_id === currentUser?.id))) {
      viewport.scrollTop = viewport.scrollHeight;
      nearBottom.current = true;
    }
    previousLatest.current = { conversationId, messageId: latest?.id };
  }, [conversationId, currentUser?.id, messages.isSuccess, orderedMessages]);

  useEffect(() => {
    if (!isVisible || !currentUser) return;
    const unread = orderedMessages.filter((message) => {
      const key = `${currentUser.id}:${message.id}`;
      return (
        message.sender_id !== currentUser.id &&
        !acknowledged.current.has(key) &&
        !(message.receipts ?? []).some((receipt) => receipt.user_id === currentUser.id && receipt.read_at)
      );
    });
    for (const message of unread) acknowledged.current.add(`${currentUser.id}:${message.id}`);
    receiptQueue.current = receiptQueue.current.then(async () => {
      let updated = false;
      for (const message of unread) {
        try {
          await apiRequest(`message-receipts/${message.id}/read`, { method: 'PATCH' });
          updated = true;
          setReceiptError(null);
        } catch (reason) {
          acknowledged.current.delete(`${currentUser.id}:${message.id}`);
          setReceiptError(reason instanceof Error ? reason.message : text('Could not mark messages as read.'));
        }
      }
      if (updated) {
        try {
          await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } catch (reason) {
          setReceiptError(reason instanceof Error ? reason.message : text('Could not mark messages as read.'));
        }
      }
    });
  }, [currentUser, isVisible, orderedMessages, text, queryClient]);
  const otherMember = currentUser
    ? conversation.data?.members.find(({ user_id }) => user_id !== currentUser.id)?.user
    : undefined;
  const isAdmin = conversation.data?.members.some(
    ({ user_id, role }) => user_id === currentUser?.id && role === 'admin',
  );
  const title =
    conversation.data?.group?.name ||
    conversation.data?.name ||
    otherMember?.name ||
    (conversation.data?.type === 'private' ? text('Direct message') : text('Conversation'));

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      {deletingChat && <DeleteChatDialog conversationId={conversationId} onClose={() => setDeletingChat(false)} />}
      <header className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3 md:px-6">
        <Button
          aria-label={text('Back to conversations')}
          className="md:hidden"
          nativeButton={false}
          render={<Link href="/chat" />}
          size="icon"
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <Avatar className="size-10">
          {otherMember?.avatar_url && conversation.data?.type === 'private' && (
            <AvatarImage alt="" src={otherMember.avatar_url} />
          )}
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {title.charAt(0).toUpperCase()}
          </AvatarFallback>
          {conversation.data?.type === 'private' && <PresenceStatus presence={otherMember?.presence ?? null} />}
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{conversation.isPending ? text('Loading conversation…') : title}</h1>
          {conversation.data?.type === 'private' ? (
            <div className="flex items-center gap-2">
              <span className="truncate text-xs text-muted-foreground">
                {otherMember ? `@${otherMember.username}` : ''}
              </span>
            </div>
          ) : (
            <p className="truncate text-xs text-muted-foreground">
              {conversation.data ? (
                <>
                  {conversation.data.members.length} {text('members')}
                </>
              ) : (
                ''
              )}
            </p>
          )}
        </div>
        {(conversation.data?.type === 'private' || isAdmin) && (
          <Button aria-label={text('Delete chat')} size="icon-sm" variant="ghost" onClick={() => setDeletingChat(true)}>
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </header>
      {conversation.data && conversation.data.type !== 'private' && (
        <div className="border-b px-4 py-3 md:px-6">
          <MemberManager conversationId={conversationId} members={conversation.data.members} />
        </div>
      )}

      <section
        ref={messageViewport}
        onScroll={(event) => {
          const viewport = event.currentTarget;
          nearBottom.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 80;
        }}
        aria-label={text('Messages')}
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#efeae2] px-4 py-5 md:px-10 dark:bg-[#0b141a]"
      >
        {messages.isPending && <Status>{text('Loading messages…')}</Status>}
        {messages.isError && (
          <Status role="alert">
            {text('Could not load messages.')} {text(messages.error.message)}
          </Status>
        )}
        {messages.isSuccess && orderedMessages.length === 0 && (
          <Status>{text('No messages yet. Send the first message.')}</Status>
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
                {messages.isFetchingNextPage ? text('Loading…') : text('Load earlier messages')}
              </Button>
            )}
            {orderedMessages.map((message) => {
              const isOwn = message.sender_id === currentUser?.id;
              const receipts = message.receipts ?? [];
              const isRead = receipts.length > 0 && receipts.every((receipt) => receipt.read_at);
              const isDelivered =
                receipts.length > 0 && receipts.every((receipt) => receipt.delivered_at || receipt.read_at);
              return (
                <article className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`} key={message.id}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[70%] ${isOwn ? 'rounded-tr-none bg-[#d9fdd3] text-[#172a1e] dark:bg-[#005c4b] dark:text-white' : 'rounded-tl-none bg-white text-foreground dark:bg-[#202c33]'}`}
                  >
                    {!isOwn && <p className="mb-1 text-xs font-medium">{message.sender.name}</p>}
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.content ||
                        (message.attachments.length ? text('Shared attachment') : text('Shared content'))}
                    </p>
                    {message.attachments.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {message.attachments.map((attachment) => (
                          <li key={attachment.id}>
                            <a
                              className="text-xs underline underline-offset-2"
                              href={`/api/backend/message-attachments/${attachment.id}/file`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {attachment.file_name || text('Download attachment')}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="mt-1 flex items-center justify-end gap-1 text-[11px]">
                      {message.edited_at && <span className="opacity-70">{text('Edited')}</span>}
                      <time className="opacity-70" dateTime={message.created_at}>
                        {formatTime(message.created_at, locale)}
                      </time>
                      {isOwn && (
                        <span
                          aria-label={isRead ? text('Read') : isDelivered ? text('Delivered') : text('Sent')}
                          title={isRead ? text('Read') : isDelivered ? text('Delivered') : text('Sent')}
                        >
                          {isRead || isDelivered ? (
                            <CheckCheck
                              aria-hidden="true"
                              className={`size-3.5 ${isRead ? 'text-sky-500' : 'opacity-70'}`}
                            />
                          ) : (
                            <Check aria-hidden="true" className="size-3.5 opacity-70" />
                          )}
                          {currentUser && (
                            <MessageActions
                              message={message}
                              conversationId={conversationId}
                              own={isOwn}
                              canDeleteForEveryone={
                                isOwn || (conversation.data?.type !== 'private' && Boolean(isAdmin))
                              }
                            />
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {conversation.isError && (
        <p className="border-t px-4 py-3 text-sm text-destructive" role="alert">
          {text('Could not load this conversation.')}
          {text(conversation.error.message)}
        </p>
      )}
      {receiptError && (
        <p className="border-t px-4 py-2 text-xs text-destructive" role="alert">
          {text(receiptError)}
        </p>
      )}
      <footer className="border-t bg-muted/50 p-3 md:px-6">
        <MessageComposer
          key={conversationId}
          conversationId={conversationId}
          disabled={conversation.isError || conversation.isPending}
        />
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

function formatTime(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}
