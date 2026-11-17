'use client';

import type {
  ConversationEvent,
  MessageChangeEvent,
  RealtimeMessage,
  RealtimeSession,
  ServerRealtimeEvents,
  TUserSettings,
} from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useNotificationSound } from '@/components/app/notification-sound';
import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

export function RealtimeUpdates({
  onNotification,
  onContentRemoved,
}: {
  onNotification: (message: RealtimeMessage) => void;
  onContentRemoved: (event: ConversationEvent & { id?: string }) => void;
}) {
  const text = useUiText();
  const { play: playSound } = useNotificationSound();
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  const activeNotifications = useRef(new Map<string, RealtimeMessage>());
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
    const pendingNotifications = new Map<string, RealtimeMessage>();
    const browserNotifications = new Map<string, Notification>();
    const pendingConversations = new Set<string>();
    let reconciling = false;

    function reportError(reason: unknown) {
      if (!disposed) {
        setActionError(reason instanceof Error ? reason.message : text('Could not update message delivery.'));
      }
    }

    function removeNotification(event: ConversationEvent & { id?: string }) {
      for (const [id, message] of pendingNotifications) {
        if (event.id ? id === event.id : message.conversation_id === event.conversation_id) {
          pendingNotifications.delete(id);
        }
      }
      onContentRemoved(event);
      setNotification((current) =>
        current && (event.id ? current.id === event.id : current.conversation_id === event.conversation_id)
          ? null
          : current,
      );
      for (const [id, message] of activeNotifications.current) {
        if (event.id ? id === event.id : message.conversation_id === event.conversation_id) {
          browserNotifications.get(id)?.close();
          browserNotifications.delete(id);
          activeNotifications.current.delete(id);
        }
      }
    }

    async function reconcileNotifications() {
      if (disposed || reconciling) return;
      reconciling = true;
      try {
        await Promise.all(
          [...activeNotifications.current.values()].map(async (message) => {
            try {
              const current = await apiRequest<RealtimeMessage>(`messages/${message.id}`);
              if (!disposed && current.content !== message.content) removeNotification(message);
            } catch (reason) {
              if (disposed) return;
              if (reason instanceof ApiError && (reason.status === 404 || reason.status === 403)) {
                removeNotification(message);
                refreshConversation(message);
              } else {
                reportError(reason);
              }
            }
          }),
        );
      } finally {
        reconciling = false;
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
        void reconcileNotifications();
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
          void apiRequest(`message-receipts/${message.id}/delivered`, { method: 'POST' }).catch((reason) => {
            if (reason instanceof ApiError && reason.status === 404) return;
            reportError(reason);
          });
        }
      });
      socket.on('message:notification', (message) => {
        if (message.sender_id === userId || seenNotifications.has(message.id)) return;
        seenNotifications.add(message.id);
        if (seenNotifications.size > 200) {
          const oldestId = seenNotifications.values().next().value;
          if (oldestId) seenNotifications.delete(oldestId);
        }
        pendingNotifications.set(message.id, message);
        void showNotification(message)
          .catch(reportError)
          .finally(() => pendingNotifications.delete(message.id));
      });
      const messageChanged = (event: MessageChangeEvent) => {
        removeNotification(event);
        refreshConversation(event);
      };
      socket.on('message:updated', messageChanged);
      socket.on('message:deleted', messageChanged);
      socket.on('message:attachment', refreshConversation);
      socket.on('message:receipt', refreshConversation);
      socket.on('message:reaction', refreshConversation);
      socket.on('conversation:updated', refreshConversation);
      socket.on('conversation:deleted', (event) => {
        removeNotification(event);
        pendingConversations.delete(event.conversation_id);
        queryClient.removeQueries({ queryKey: ['messages', event.conversation_id] });
        queryClient.removeQueries({ queryKey: ['conversation', event.conversation_id] });
        if (pathnameRef.current === `/chat/${event.conversation_id}`) router.replace('/chat');
        void queryClient.invalidateQueries({ queryKey: ['conversations'] }).catch(reportError);
      });
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

    async function showNotification(event: RealtimeMessage) {
      let message: RealtimeMessage;
      try {
        // A delayed creation event must not resurrect a message deleted on another device.
        message = await apiRequest<RealtimeMessage>(`messages/${event.id}`);
      } catch (reason) {
        if (reason instanceof ApiError && (reason.status === 404 || reason.status === 403)) return;
        throw reason;
      }
      if (disposed || !pendingNotifications.has(message.id)) return;
      const settings = queryClient.getQueryData<TUserSettings>(['user-settings']);
      if (settings?.notification_enabled === false) return;
      const viewingChat =
        pathnameRef.current === `/chat/${message.conversation_id}` && document.visibilityState === 'visible';
      if (viewingChat) return;
      activeNotifications.current.set(message.id, message);
      if (activeNotifications.current.size > 50) {
        const oldestId = activeNotifications.current.keys().next().value;
        if (oldestId) {
          browserNotifications.get(oldestId)?.close();
          browserNotifications.delete(oldestId);
          activeNotifications.current.delete(oldestId);
        }
      }
      onNotification(message);
      setNotification(message);
      try {
        playSound();
      } catch {
        setActionError(
          text('Could not enable or play notification sound. Check your browser permissions and storage settings.'),
        );
      }
      if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        try {
          const alert = new Notification(message.sender.name, {
            body: message.content || text('Shared an attachment'),
            tag: message.id,
            silent: true,
          });
          browserNotifications.set(message.id, alert);
          alert.onclose = () => {
            if (browserNotifications.get(message.id) === alert) browserNotifications.delete(message.id);
          };
          alert.onclick = () => {
            window.focus();
            window.location.assign(`/chat/${message.conversation_id}`);
            alert.close();
          };
        } catch (reason) {
          reportError(reason);
        }
      }
    }
    void connect();
    const reconciliationTimer = setInterval(() => void reconcileNotifications(), 30000);
    const reconcileVisible = () => {
      if (document.visibilityState === 'visible') void reconcileNotifications();
    };
    document.addEventListener('visibilitychange', reconcileVisible);
    window.addEventListener('online', reconcileVisible);

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearTimeout(refreshTimer);
      clearInterval(reconciliationTimer);
      document.removeEventListener('visibilitychange', reconcileVisible);
      window.removeEventListener('online', reconcileVisible);
      for (const alert of browserNotifications.values()) alert.close();
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [userId, queryClient, onNotification, onContentRemoved, text, playSound, router]);

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
