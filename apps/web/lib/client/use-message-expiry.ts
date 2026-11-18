'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function useMessageExpiry(expirations: Array<string | null | undefined>) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState<string | null>(null);
  const next = expirations.reduce((nearest, value) => {
    const time = value ? Date.parse(value) : Infinity;
    return time > now ? Math.min(nearest, time) : nearest;
  }, Infinity);

  useEffect(() => {
    if (!Number.isFinite(next)) return;
    const timer = setTimeout(
      () => {
        setNow(Date.now());
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ['conversations'] }),
          queryClient.invalidateQueries({ queryKey: ['messages'] }),
          queryClient.invalidateQueries({ queryKey: ['pinned-messages'] }),
          queryClient.invalidateQueries({ queryKey: ['message-preview'] }),
        ])
          .then(() => setError(null))
          .catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : 'Could not refresh expired messages.');
          });
      },
      Math.min(Math.max(1, next - Date.now() + 10), 2147483647),
    );
    return () => clearTimeout(timer);
  }, [next, queryClient]);

  return { now, error };
}
