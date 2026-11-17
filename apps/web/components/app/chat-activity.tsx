'use client';

import type { ClientRealtimeEvents, ServerRealtimeEvents, TypingEvent } from '@repo/shared';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { useUiText } from '@/i18n/ui-text';

type ChatSocket = Socket<ServerRealtimeEvents, ClientRealtimeEvents>;
type Activity = {
  typers: Array<TypingEvent & { expires: number }>;
  sendTyping: (conversationId: string, typing: boolean) => void;
  setSocket: (socket: ChatSocket | null) => void;
  receiveTyping: (event: TypingEvent) => void;
};
const ActivityContext = createContext<Activity | null>(null);

export function ChatActivityProvider({ children }: { children: ReactNode }) {
  const text = useUiText();
  const socket = useRef<ChatSocket | null>(null);
  const lastSent = useRef<{ id: string; at: number; typing: boolean } | null>(null);
  const [typers, setTypers] = useState<Activity['typers']>([]);
  const [error, setError] = useState(false);
  const setSocket = useCallback((value: ChatSocket | null) => {
    socket.current = value;
    lastSent.current = null;
    setTypers([]);
    setError(false);
  }, []);
  const receiveTyping = useCallback((event: TypingEvent) => {
    setTypers((current) => [
      ...current.filter((entry) => entry.conversation_id !== event.conversation_id || entry.user_id !== event.user_id),
      ...(event.typing ? [{ ...event, expires: Date.now() + 6000 }] : []),
    ]);
  }, []);
  const sendTyping = useCallback((id: string, typing: boolean) => {
    if (!socket.current?.connected) return;
    const previous = lastSent.current;
    if (previous?.id === id && previous.typing === typing && (!typing || Date.now() - previous.at < 2000)) return;
    lastSent.current = { id, typing, at: Date.now() };
    const activeSocket = socket.current;
    activeSocket.timeout(5000).emit('conversation:typing', { conversation_id: id, typing }, (reason, result) => {
      if (socket.current !== activeSocket) return;
      const failed = Boolean(reason) || result?.ok !== true;
      setError(failed);
      if (failed && lastSent.current?.id === id && lastSent.current.typing === typing) {
        lastSent.current = null;
      }
    });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setTypers((current) =>
        current.some((entry) => entry.expires <= Date.now())
          ? current.filter((entry) => entry.expires > Date.now())
          : current,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const value = useMemo(
    () => ({ typers, sendTyping, setSocket, receiveTyping }),
    [typers, sendTyping, setSocket, receiveTyping],
  );
  return (
    <ActivityContext.Provider value={value}>
      {error && (
        <p role="alert" className="bg-background px-4 py-2 text-xs text-destructive">
          {text('Could not update typing status.')}
        </p>
      )}
      {children}
    </ActivityContext.Provider>
  );
}

export function useChatActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('Chat activity provider is missing');
  return context;
}
