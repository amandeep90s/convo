'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateGroupDto, createGroupSchema } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

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
  const form = useForm<z.input<typeof createGroupSchema>, unknown, CreateGroupDto>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '', description: '' },
  });
  const communities = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiRequest<PageResponse<Community>>('communities?page=1&limit=50'),
    retry: false,
  });
  const create = useMutation({
    mutationFn: (body: CreateGroupDto) => apiRequest<Community>('communities', { method: 'POST', body }),
    onSuccess: async (community) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['communities'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      router.push(`/communities/${community.conversation_id}`);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not create the community.'),
  });

  function submit(data: CreateGroupDto) {
    setError(null);
    create.mutate(data);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-[1.75rem] bg-gradient-to-br from-[#063f35] via-[#087e64] to-[#25a87e] px-6 py-7 text-white shadow-xl shadow-primary/15 sm:px-9 sm:py-9">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-50/80 uppercase">Find your circle</p>
          <h1 className="text-3xl font-semibold tracking-tight">Communities</h1>
          <p className="mt-2 text-sm text-emerald-50/85">Create a community or manage the ones you have joined.</p>
        </div>
        <Button
          className="h-11 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={() => setFormOpen((open) => !open)}
          type="button"
          variant="outline"
        >
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
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="community-name">Community name</Label>
                <Input
                  aria-describedby={form.formState.errors.name ? 'community-name-error' : undefined}
                  aria-invalid={Boolean(form.formState.errors.name)}
                  className="h-11 rounded-xl bg-background/70 px-3"
                  id="community-name"
                  maxLength={100}
                  {...form.register('name')}
                />
                {form.formState.errors.name?.message && (
                  <p className="text-xs font-medium text-destructive" id="community-name-error">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="community-description">Description</Label>
                <Textarea
                  className="min-h-24 rounded-xl bg-background/70 px-3 py-2.5"
                  id="community-description"
                  maxLength={1000}
                  {...form.register('description')}
                />
              </div>
              <div>
                <Button
                  className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-5 font-semibold shadow-lg shadow-primary/15 hover:brightness-105"
                  disabled={create.isPending}
                  type="submit"
                >
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
