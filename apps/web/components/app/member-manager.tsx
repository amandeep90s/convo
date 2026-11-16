'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Person = { id: string; name: string; username: string; about?: string | null; avatar_url?: string | null };
type Member = { user_id: string; role: string; user: Person };
type SearchResponse = { data: Person[] };

export function MemberManager({ conversationId, members }: { conversationId: string; members: Member[] }) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = members.some(({ user_id, role }) => user_id === currentUser?.id && role === 'admin');
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const search = useQuery({
    queryKey: ['member-search', conversationId, submittedSearch],
    queryFn: () =>
      apiRequest<SearchResponse>(`users/search?${new URLSearchParams({ q: submittedSearch, page: '1', limit: '20' })}`),
    enabled: submittedSearch.length >= 2,
    retry: false,
  });
  const addMember = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`conversation-members/${conversationId}`, { method: 'POST', body: { user_id: userId } }),
    onSuccess: async () => {
      setError(null);
      setSubmittedSearch('');
      setSearchText('');
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not add this member.'),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = searchText.trim();
    if (term.length < 2) {
      setError('Enter at least 2 characters to search for people.');
      setSubmittedSearch('');
      return;
    }
    setError(null);
    setSubmittedSearch(term);
  }

  const memberIds = new Set(members.map(({ user_id }) => user_id));

  return (
    <details className="rounded-lg border bg-background p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
        <Users aria-hidden="true" className="size-4 text-primary" />
        Members ({members.length})
      </summary>
      <ul className="mt-3 divide-y">
        {members.map(({ user_id, role, user }) => (
          <li className="flex items-center justify-between py-2" key={user_id}>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
            </span>
            <span className="text-xs text-muted-foreground capitalize">{role}</span>
          </li>
        ))}
      </ul>
      {isAdmin && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-3 text-sm font-medium">Add a member</p>
          <form className="flex gap-2" onSubmit={submit}>
            <Input
              aria-label="Search people to add"
              maxLength={100}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Name or username"
              value={searchText}
            />
            <Button disabled={search.isFetching} type="submit" variant="outline">
              Search
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {search.isError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {search.error.message}
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
                      aria-label={`Add ${person.name}`}
                      disabled={addMember.isPending && addMember.variables === person.id}
                      onClick={() => addMember.mutate(person.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <UserPlus aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              {search.data.data.every((person) => memberIds.has(person.id)) && (
                <li className="text-sm text-muted-foreground">No additional people found.</li>
              )}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
