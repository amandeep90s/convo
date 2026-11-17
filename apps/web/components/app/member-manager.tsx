'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateConversationMemberDto, TUser } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Person = Pick<TUser, 'id' | 'name' | 'username' | 'about' | 'avatar_url'>;
type Member = { user_id: string; role: string; user: Person };
type SearchResponse = { data: Person[] };

const memberSearchSchema = z.object({
  query: z.string().trim().min(2, 'Enter at least 2 characters to search for people.').max(100),
});

export function MemberManager({ conversationId, members }: { conversationId: string; members: Member[] }) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = members.some(({ user_id, role }) => user_id === currentUser?.id && role === 'admin');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof memberSearchSchema>, unknown, z.output<typeof memberSearchSchema>>({
    resolver: zodResolver(memberSearchSchema),
    defaultValues: { query: '' },
  });
  const search = useQuery({
    queryKey: ['member-search', conversationId, submittedSearch],
    queryFn: () =>
      apiRequest<SearchResponse>(`users/search?${new URLSearchParams({ q: submittedSearch, page: '1', limit: '20' })}`),
    enabled: submittedSearch.length >= 2,
    retry: false,
  });
  const addMember = useMutation({
    mutationFn: (body: CreateConversationMemberDto) =>
      apiRequest(`conversation-members/${conversationId}`, { method: 'POST', body }),
    onSuccess: async () => {
      setError(null);
      setSubmittedSearch('');
      form.reset({ query: '' });
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : text('Could not add this member.')),
  });

  function submit({ query }: z.output<typeof memberSearchSchema>) {
    setError(null);
    setSubmittedSearch(query);
  }

  const memberIds = new Set(members.map(({ user_id }) => user_id));

  return (
    <details className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
        <Users aria-hidden="true" className="size-4 text-primary" />
        {text('Members (')}
        {members.length})
      </summary>
      <ul className="mt-3 divide-y">
        {members.map(({ user_id, role, user }) => (
          <li className="flex items-center justify-between py-2" key={user_id}>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
            </span>
            <span className="text-xs text-muted-foreground capitalize">{text(role)}</span>
          </li>
        ))}
      </ul>
      {isAdmin && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-3 text-sm font-medium">{text('Add a member')}</p>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={form.handleSubmit(submit)}>
            <Input
              aria-label={text('Search people to add')}
              aria-invalid={Boolean(form.formState.errors.query)}
              aria-describedby={form.formState.errors.query ? 'member-search-error' : undefined}
              className="h-10 rounded-xl bg-background/70 px-3"
              maxLength={100}
              placeholder={text('Name or username')}
              {...form.register('query')}
            />
            <Button className="h-10 shrink-0 rounded-xl" disabled={search.isFetching} type="submit" variant="outline">
              {text('Search')}
            </Button>
          </form>
          {form.formState.errors.query?.message && (
            <p className="mt-2 text-xs font-medium text-destructive" id="member-search-error">
              {text(form.formState.errors.query.message)}
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {text(error)}
            </p>
          )}
          {search.isError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {text(search.error.message)}
            </p>
          )}
          {search.isSuccess && (
            <ul className="mt-3 flex flex-col gap-2">
              {search.data.data
                .filter((person) => !memberIds.has(person.id))
                .map((person) => (
                  <li className="flex items-center justify-between gap-3" key={person.id}>
                    <span className="min-w-0 truncate text-sm">
                      {person.name} <span className="text-muted-foreground">@{person.username}</span>
                    </span>
                    <Button
                      aria-label={text('Add {value0}', { value0: person.name })}
                      disabled={addMember.isPending && addMember.variables?.user_id === person.id}
                      onClick={() => addMember.mutate({ user_id: person.id })}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <UserPlus aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              {search.data.data.every((person) => memberIds.has(person.id)) && (
                <li className="text-sm text-muted-foreground">{text('No additional people found.')}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
