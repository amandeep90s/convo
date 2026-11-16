'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiRequest } from '@/lib/client/api';

type Community = {
  conversation_id: string;
  description: string | null;
  conversation: { id: string; name: string | null; members: Array<{ user_id: string }> };
};
type PageResponse<T> = { data: T[]; total: number };

export function CommunityManager() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const communities = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiRequest<PageResponse<Community>>('communities?page=1&limit=50'),
    retry: false,
  });
  const create = useMutation({
    mutationFn: (body: { name: string; description: string }) =>
      apiRequest<Community>('communities', { method: 'POST', body }),
    onSuccess: async (community) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['communities'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      router.push(`/communities/${community.conversation_id}`);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not create the community.'),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    if (!name) {
      setError('Community name is required.');
      return;
    }
    setError(null);
    create.mutate({ name, description });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Communities</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a community or manage the ones you have joined.</p>
        </div>
        <Button onClick={() => setFormOpen((open) => !open)} type="button" variant="outline">
          <Plus aria-hidden="true" />
          {formOpen ? 'Cancel' : 'Create community'}
        </Button>
      </header>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {formOpen && (
        <Card>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="community-name">Community name</Label>
                <Input id="community-name" maxLength={100} name="name" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="community-description">Description</Label>
                <Textarea id="community-description" maxLength={1000} name="description" />
              </div>
              <div>
                <Button disabled={create.isPending} type="submit">
                  {create.isPending ? 'Creating…' : 'Create community'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {communities.isPending && <Status>Loading communities…</Status>}
      {communities.isError && <Status role="alert">Could not load communities. {communities.error.message}</Status>}
      {communities.isSuccess && communities.data.data.length === 0 && (
        <Status>You have not joined any communities yet.</Status>
      )}
      {communities.isSuccess &&
        communities.data.data.map((community) => (
          <Link
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            href={`/communities/${community.conversation_id}`}
            key={community.conversation_id}
          >
            <Card className="transition-colors hover:bg-muted/30">
              <CardContent className="flex-row items-start gap-4">
                <Users aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{community.conversation.name ?? 'Community'}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {community.description || 'No description'}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">Joined community</span>
                </span>
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
