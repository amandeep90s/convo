'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Call = {
  id: string;
  conversation_id: string;
  initiated_by: string;
  type: 'audio' | 'video';
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  participants: Array<{
    user_id: string;
    joined_at: string | null;
    left_at: string | null;
    user: { name: string; username: string };
  }>;
};

export function CallView({ callId }: { callId: string }) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const call = useQuery({
    queryKey: ['call', callId],
    queryFn: () => apiRequest<Call>(`calls/${callId}`),
    retry: false,
  });
  const updateCall = useMutation({
    mutationFn: (status: 'accepted' | 'rejected' | 'ended') =>
      apiRequest(`calls/${callId}`, { method: 'PATCH', body: { status } }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['call', callId] }),
        queryClient.invalidateQueries({ queryKey: ['calls'] }),
      ]);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : text('Could not update this call.')),
  });
  const ownParticipant = call.data?.participants.find(({ user_id }) => user_id === currentUser?.id);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{text('Call details')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text('Session status and participants.')}</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>
            {call.data ? `${text(call.data.type)} ${text('call ·')} ${text(call.data.status)}` : text('Call session')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {call.isPending && <p className="text-sm text-muted-foreground">{text('Loading call…')}</p>}
          {call.isError && (
            <p className="text-sm text-destructive" role="alert">
              {text(call.error.message)}
            </p>
          )}
          {call.data && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {text(
                  'Audio/video transport is not available in this web client. These controls update call session state only.',
                )}
              </p>
              <ul className="flex flex-col divide-y">
                {call.data.participants.map(({ user_id, user, joined_at, left_at }) => (
                  <li className="flex items-center justify-between py-3" key={user_id}>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {left_at ? text('Left') : joined_at ? text('Joined') : text('Invited')}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {call.data.status === 'ringing' && call.data.initiated_by !== currentUser?.id && ownParticipant && (
                  <>
                    <Button disabled={updateCall.isPending} onClick={() => updateCall.mutate('accepted')} type="button">
                      {text('Accept session')}
                    </Button>
                    <Button
                      disabled={updateCall.isPending}
                      onClick={() => updateCall.mutate('rejected')}
                      type="button"
                      variant="outline"
                    >
                      {text('Decline')}
                    </Button>
                  </>
                )}
                {['ringing', 'accepted'].includes(call.data.status) && call.data.initiated_by === currentUser?.id && (
                  <Button
                    disabled={updateCall.isPending}
                    onClick={() => updateCall.mutate('ended')}
                    type="button"
                    variant="destructive"
                  >
                    {text('End session')}
                  </Button>
                )}
                {call.data.status === 'accepted' && call.data.initiated_by !== currentUser?.id && ownParticipant && (
                  <Button
                    disabled={updateCall.isPending}
                    onClick={() => updateCall.mutate('ended')}
                    type="button"
                    variant="outline"
                  >
                    {text('End session')}
                  </Button>
                )}
                <Button
                  nativeButton={false}
                  render={<Link href={`/chat/${call.data.conversation_id}`} />}
                  variant="outline"
                >
                  {text('Open conversation')}
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {text(error)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
