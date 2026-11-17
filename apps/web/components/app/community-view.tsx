'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Link2, Users } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Community = {
  conversation_id: string;
  description: string | null;
  created_by: string;
  conversation: {
    id: string;
    name: string | null;
    members: Array<{ user_id: string; role: string; user: { id: string; name: string; username: string } }>;
  };
};
type Invite = { code: string };

export function CommunityView({ communityId }: { communityId: string }) {
  const text = useUiText();
  const { data: currentUser } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const community = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => apiRequest<Community>(`communities/${communityId}`),
    retry: false,
  });

  async function createInvite() {
    setError(null);
    setCopied(false);
    try {
      const invite = await apiRequest<Invite>(`group-invites/conversations/${communityId}`, {
        method: 'POST',
        body: {},
      });
      setInviteUrl(`${window.location.origin}/invite/${invite.code}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : text('Could not create an invite.'));
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setError(text('Could not copy the invite link. Select and copy it manually.'));
    }
  }

  const isAdmin = community.data?.conversation.members.some(
    ({ user_id, role }) => user_id === currentUser?.id && role === 'admin',
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {community.data?.conversation.name ?? text('Community')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {community.data?.description || text('No community description.')}
        </p>
      </header>
      {community.isPending && <Status>{text('Loading community…')}</Status>}
      {community.isError && (
        <Status role="alert">
          {text('Could not load this community.')} {text(community.error.message)}
        </Status>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {text(error)}
        </p>
      )}
      {community.data && (
        <>
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>{text('Invite members')}</CardTitle>
              </CardHeader>
              <CardContent className="gap-3">
                <p className="text-sm text-muted-foreground">
                  {text('Create a shareable invite link for this community.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void createInvite()} type="button" variant="outline">
                    <Link2 aria-hidden="true" />
                    {text('Create invite link')}
                  </Button>
                  {inviteUrl && (
                    <Button onClick={() => void copyInvite()} type="button" variant="outline">
                      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      {copied ? text('Copied') : text('Copy link')}
                    </Button>
                  )}
                </div>
                {inviteUrl && (
                  <p className="rounded-md bg-muted p-3 text-xs break-all" aria-label={text('Community invite link')}>
                    {inviteUrl}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users aria-hidden="true" className="size-4" />
                {text('Members (')}
                {community.data.conversation.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {community.data.conversation.members.map(({ user_id, role, user }) => (
                <div className="flex items-center justify-between border-b py-3 last:border-0" key={user_id}>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{text(role)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
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
