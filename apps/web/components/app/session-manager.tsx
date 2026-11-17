'use client';

import type { TUserDevice, TUserSession } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, ShieldCheck } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, apiRequest } from '@/lib/client/api';

type Session = Pick<TUserSession, 'id' | 'device_id' | 'ip_address' | 'user_agent' | 'expires_at' | 'created_at'> & {
  device: Pick<TUserDevice, 'device_type' | 'device_name' | 'last_seen_at'>;
};

export function SessionManager() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const sessions = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => apiRequest<Session[]>('user-sessions'),
    retry: false,
  });
  const revoke = useMutation({
    mutationFn: (sessionId: string) => apiRequest(`user-sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not revoke this session.'),
  });
  const revokeOthers = useMutation({
    mutationFn: () => apiRequest<{ revokedCount: number }>('user-sessions/others', { method: 'DELETE' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not revoke other sessions.'),
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Account center</p>
          <h1 className="text-3xl font-semibold tracking-tight">Security</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review devices currently signed in to your account.</p>
        </div>
        <Button
          disabled={revokeOthers.isPending || !sessions.data || sessions.data.length < 2}
          onClick={() => revokeOthers.mutate()}
          type="button"
          variant="outline"
        >
          Revoke other sessions
        </Button>
      </header>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {sessions.isPending && <Status>Loading active sessions…</Status>}
      {sessions.isError && <Status role="alert">Could not load active sessions. {sessions.error.message}</Status>}
      {sessions.isSuccess && sessions.data.length === 0 && <Status>No active sessions found.</Status>}
      {sessions.isSuccess &&
        sessions.data.map((session) => (
          <Card key={session.id}>
            <CardContent className="flex-row items-center justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Monitor aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{session.device.device_name || session.device.device_type}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Signed in {formatDate(session.created_at)}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.ip_address ? `IP ${session.ip_address} · ` : ''}Expires {formatDate(session.expires_at)}
                  </p>
                </div>
              </div>
              <Button
                disabled={revoke.isPending && revoke.variables === session.id}
                onClick={() => revoke.mutate(session.id)}
                type="button"
                variant="outline"
              >
                Revoke
              </Button>
            </CardContent>
          </Card>
        ))}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4" />
        Revoking a session immediately invalidates its refresh credentials.
      </p>
    </div>
  );
}

function Status({ children, role }: { children: ReactNode; role?: 'alert' }) {
  return (
    <p className="rounded-xl border bg-background px-5 py-8 text-center text-sm text-muted-foreground" role={role}>
      {children}
    </p>
  );
}

function formatDate(value: string | Date): string {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 'unknown time' : date.toLocaleString();
}
