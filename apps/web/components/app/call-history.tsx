'use client';

import { useQuery } from '@tanstack/react-query';
import { AudioLines, Video } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/client/api';

type Call = {
  id: string;
  conversation_id: string;
  type: 'audio' | 'video';
  status: string;
  created_at: string;
  participants: Array<{ user_id: string; user: { name: string; username: string } }>;
};
type PageResponse<T> = { data: T[]; total: number };

export function CallHistory() {
  const calls = useQuery({
    queryKey: ['calls'],
    queryFn: () => apiRequest<PageResponse<Call>>('calls?page=1&limit=50'),
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Calls</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review call session history and participants.</p>
      </header>
      <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        This web client can display and update call session state, but it does not yet include audio/video media
        transport.
      </p>
      {calls.isPending && <Status>Loading call history…</Status>}
      {calls.isError && <Status role="alert">Could not load calls. {calls.error.message}</Status>}
      {calls.isSuccess && calls.data.data.length === 0 && <Status>No call history yet.</Status>}
      {calls.isSuccess &&
        calls.data.data.map((call) => (
          <Link
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            href={`/calls/${call.id}`}
            key={call.id}
          >
            <Card className="transition-colors hover:bg-muted/30">
              <CardContent className="flex-row items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {call.type === 'video' ? (
                    <Video aria-hidden="true" className="size-5 text-primary" />
                  ) : (
                    <AudioLines aria-hidden="true" className="size-5 text-primary" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium capitalize">
                      {call.type} call · {call.status}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {call.participants.map(({ user }) => user.name).join(', ') || 'Participants unavailable'}
                    </p>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={call.created_at}>
                  {formatDate(call.created_at)}
                </time>
              </CardContent>
            </Card>
          </Link>
        ))}
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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown time' : date.toLocaleString();
}
