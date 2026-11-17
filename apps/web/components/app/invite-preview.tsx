'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';

type InvitePreview = {
  code: string;
  expires_at: string | null;
  remaining_uses: number | null;
  group: { id: string; name: string | null; description: string | null; member_count: number };
};

export function InvitePreview({ code }: { code: string }) {
  const text = useUiText();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const invite = useQuery({
    queryKey: ['invite-preview', code],
    queryFn: () => apiRequest<InvitePreview>(`group-invites/code/${code}`),
    retry: false,
  });

  async function join() {
    setIsJoining(true);
    setJoinError(null);
    try {
      const result = await apiRequest<{ conversation_id: string }>(`group-invites/code/${code}/join`, {
        method: 'POST',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['communities'] }),
      ]);
      router.replace(`/chat/${result.conversation_id}`);
    } catch (reason) {
      setJoinError(reason instanceof ApiError ? reason.message : text('Could not join this conversation.'));
      setIsJoining(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{text('Conversation invitation')}</CardTitle>
          <p className="text-sm text-muted-foreground">{text('Review the invitation before joining.')}</p>
        </CardHeader>
        <CardContent>
          {invite.isPending && <p className="text-sm text-muted-foreground">{text('Checking invite…')}</p>}
          {invite.isError && (
            <p className="text-sm text-destructive" role="alert">
              {text('This invite is invalid or expired.')}
              {text(invite.error.message)}
            </p>
          )}
          {invite.data && (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-semibold">{invite.data.group.name ?? text('Community')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invite.data.group.description || text('No description available.')}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {invite.data.group.member_count} {text('members')}
                </p>
              </div>
              {joinError && (
                <p className="text-sm text-destructive" role="alert">
                  {joinError}
                </p>
              )}
              <Button disabled={isJoining} onClick={() => void join()} type="button">
                {isJoining ? text('Joining…') : text('Join conversation')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
