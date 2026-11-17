'use client';

import type {
  ConversationEvent,
  RealtimeMessage,
  RealtimeSession,
  ServerRealtimeEvents,
  TUserSettings,
} from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useNotificationSound } from '@/components/app/notification-sound';
import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';
import { apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

export function RealtimeUpdates({ onNotification }: { onNotification: (message: RealtimeMessage) => void }) {
  const text = useUiText();
  const { play: playSound } = useNotificationSound();
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notification, setNotification] = useState<RealtimeMessage | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
    setNotification(null);
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: Socket<ServerRealtimeEvents> | undefined;
    const seenNotifications = new Set<string>();
    const pendingConversations = new Set<string>();

    function reportError(reason: unknown) {
      if (!disposed) {
        setActionError(reason instanceof Error ? reason.message : text('Could not update message delivery.'));
      }
    }

    function refreshConversation(event: ConversationEvent) {
      pendingConversations.add(event.conversation_id);
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        const updates = [queryClient.invalidateQueries({ queryKey: ['conversations'] })];
        for (const id of pendingConversations) {
          updates.push(
            queryClient.invalidateQueries({ queryKey: ['messages', id] }),
            queryClient.invalidateQueries({ queryKey: ['conversation', id] }),
          );
        }
        pendingConversations.clear();
        void Promise.all(updates).catch(reportError);
      }, 100);
    }

    async function connect() {
      try {
        const session = await apiRequest<RealtimeSession>('realtime/session', { method: 'POST' });
        if (disposed) return;
        socket?.removeAllListeners();
        socket?.disconnect();
        socket = io(session.url, {
          auth: { token: session.token },
          autoConnect: false,
          transports: ['websocket'],
          reconnection: false,
          forceNew: true,
        });
        subscribe(socket);
        socket.connect();
      } catch (reason) {
        if (disposed) return;
        setConnectionError(reason instanceof Error ? reason.message : text('Could not connect to live updates.'));
        reconnect();
      }
    }

    function reconnect() {
      if (disposed || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void connect();
      }, 5000);
    }

    function subscribe(socket: Socket<ServerRealtimeEvents>) {
      socket.on('connect', () => {
        setConnectionError(null);
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ['conversations'] }),
          queryClient.invalidateQueries({ queryKey: ['messages'] }),
          queryClient.invalidateQueries({ queryKey: ['conversation'] }),
          queryClient.invalidateQueries({ queryKey: ['user-settings'] }),
        ]).catch(reportError);
      });
      socket.on('connect_error', (reason) => {
        setConnectionError(
          text('Live updates unavailable: {value0}. Retrying; messages still refresh periodically.', {
            value0: reason.message,
          }),
        );
        reconnect();
      });
      socket.on('disconnect', () => {
        if (disposed) return;
        setConnectionError(text('Live updates disconnected. Reconnecting; messages still refresh periodically.'));
        reconnect();
      });
      socket.on('message:created', (message) => {
        refreshConversation(message);
        if (message.sender_id !== userId) {
          void apiRequest(`message-receipts/${message.id}/delivered`, { method: 'POST' }).catch(reportError);
        }
      });
      socket.on('message:notification', (message) => {
        if (message.sender_id === userId || seenNotifications.has(message.id)) return;
        seenNotifications.add(message.id);
        if (seenNotifications.size > 200) {
          const oldestId = seenNotifications.values().next().value;
          if (oldestId) seenNotifications.delete(oldestId);
        }
        const settings = queryClient.getQueryData<TUserSettings>(['user-settings']);
        if (settings?.notification_enabled === false) return;
        const viewingChat =
          pathnameRef.current === `/chat/${message.conversation_id}` && document.visibilityState === 'visible';
        if (viewingChat) return;
        onNotification(message);
        setNotification(message);
        try {
          playSound();
        } catch {
          setActionError(
            text('Could not enable or play notification sound. Check your browser permissions and storage settings.'),
          );
        }
        if (
          'Notification' in window &&
          Notification.permission === 'granted' &&
          document.visibilityState !== 'visible'
        ) {
          try {
            const alert = new Notification(message.sender.name, {
              body: message.content || text('Shared an attachment'),
              tag: message.id,
              silent: true,
            });
            alert.onclick = () => {
              window.focus();
              window.location.assign(`/chat/${message.conversation_id}`);
              alert.close();
            };
          } catch (reason) {
            reportError(reason);
          }
        }
      });
      socket.on('message:updated', refreshConversation);
      socket.on('message:deleted', refreshConversation);
      socket.on('message:attachment', refreshConversation);
      socket.on('message:receipt', refreshConversation);
      socket.on('message:reaction', refreshConversation);
      socket.on('conversation:updated', refreshConversation);
      socket.on('presence:updated', () => {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ['conversations'] }),
          queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        ]).catch(reportError);
      });
      const refreshCalls = () => {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ['calls'] }),
          queryClient.invalidateQueries({ queryKey: ['call'] }),
        ]).catch(reportError);
      };
      socket.on('call:incoming', refreshCalls);
      socket.on('call:updated', refreshCalls);
    }
    void connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearTimeout(refreshTimer);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [userId, queryClient, onNotification, text, playSound]);

  return (
    <>
      {connectionError && (
        <p className="border-b bg-muted px-4 py-2 text-xs text-muted-foreground" role="status">
          {text(connectionError)}
        </p>
      )}
      {actionError && (
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-destructive" role="alert">
          {text(actionError)}
          <Button
            aria-label={text('Dismiss live update error')}
            onClick={() => setActionError(null)}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      {notification && (
        <aside
          aria-label={text('New message')}
          className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border bg-background p-4 shadow-xl"
          role="status"
        >
          <Link
            className="min-w-0 flex-1"
            href={`/chat/${notification.conversation_id}`}
            onClick={() => setNotification(null)}
          >
            <span className="block font-semibold">{notification.sender.name}</span>
            <span className="line-clamp-2 block text-sm text-muted-foreground">
              {notification.content || text('Shared an attachment')}
            </span>
          </Link>
          <Button
            aria-label={text('Dismiss notification')}
            onClick={() => setNotification(null)}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </aside>
      )}
    </>
  );
}
