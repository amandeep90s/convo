'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Search, UserPlus, UserRoundMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Person = { id: string; name: string; username: string; about: string | null; avatar_url: string | null };
type Contact = { contact_user_id: string; nickname: string | null; contact_user: Person };
type PageResponse<T> = { data: T[]; total: number };

export function ContactManager() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const contacts = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiRequest<PageResponse<Contact>>('contacts?page=1&limit=100'),
    retry: false,
  });
  const users = useQuery({
    queryKey: ['user-search', submittedSearch],
    queryFn: () =>
      apiRequest<PageResponse<Person>>(
        `users/search?${new URLSearchParams({ q: submittedSearch, page: '1', limit: '20' })}`,
      ),
    enabled: submittedSearch.length >= 2,
    retry: false,
  });
  const addContact = useMutation({
    mutationFn: (userId: string) => apiRequest('contacts', { method: 'POST', body: { contact_user_id: userId } }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (reason) => setError(toMessage(reason, 'Could not add this contact.')),
  });
  const removeContact = useMutation({
    mutationFn: (userId: string) => apiRequest(`contacts/${userId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (reason) => setError(toMessage(reason, 'Could not remove this contact.')),
  });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
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

  async function startConversation(personId: string) {
    if (!currentUser) {
      setError('Your account could not be loaded. Refresh the page and try again.');
      return;
    }
    setError(null);
    try {
      const conversation = await apiRequest<{ conversation_id: string }>('private-conversations', {
        method: 'POST',
        body: { user_a_id: currentUser.id, user_b_id: personId },
      });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/chat/${conversation.conversation_id}`);
    } catch (reason) {
      setError(toMessage(reason, 'Could not start this conversation.'));
    }
  }

  const contactIds = new Set((contacts.data?.data ?? []).map(({ contact_user_id }) => contact_user_id));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Contacts</h1>
        <p className="mt-2 text-sm text-muted-foreground">Find people and start a private conversation.</p>
      </header>

      <Card>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
            <Input
              aria-label="Search people"
              maxLength={100}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name or username"
              value={searchText}
            />
            <Button disabled={users.isFetching} type="submit">
              <Search aria-hidden="true" />
              {users.isFetching ? 'Searching…' : 'Find people'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {submittedSearch && (
        <section className="flex flex-col gap-3" aria-labelledby="people-results-title">
          <h2 className="text-lg font-semibold" id="people-results-title">
            People
          </h2>
          {users.isPending && <Status>Searching people…</Status>}
          {users.isError && <Status role="alert">{users.error.message}</Status>}
          {users.isSuccess && users.data.data.length === 0 && <Status>No people match that search.</Status>}
          {users.isSuccess &&
            users.data.data.map((person) => (
              <PersonCard
                isContact={contactIds.has(person.id)}
                isPending={addContact.isPending && addContact.variables === person.id}
                key={person.id}
                onAdd={() => addContact.mutate(person.id)}
                onMessage={() => void startConversation(person.id)}
                person={person}
              />
            ))}
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="contacts-title">
        <h2 className="text-lg font-semibold" id="contacts-title">
          Your contacts
        </h2>
        {contacts.isPending && <Status>Loading contacts…</Status>}
        {contacts.isError && <Status role="alert">{contacts.error.message}</Status>}
        {contacts.isSuccess && contacts.data.data.length === 0 && (
          <Status>No contacts yet. Search for someone to add.</Status>
        )}
        {contacts.isSuccess &&
          contacts.data.data.map(({ contact_user: person, nickname }) => (
            <Card key={person.id}>
              <CardContent className="flex-row items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{nickname || person.name}</p>
                  <p className="truncate text-sm text-muted-foreground">@{person.username}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    aria-label={`Message ${person.name}`}
                    onClick={() => void startConversation(person.id)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <MessageCircle aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label={`Remove ${person.name} from contacts`}
                    disabled={removeContact.isPending && removeContact.variables === person.id}
                    onClick={() => removeContact.mutate(person.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <UserRoundMinus aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </section>
    </div>
  );
}

function PersonCard({
  person,
  isContact,
  isPending,
  onAdd,
  onMessage,
}: {
  person: Person;
  isContact: boolean;
  isPending: boolean;
  onAdd: () => void;
  onMessage: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex-row items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{person.name}</p>
          <p className="truncate text-sm text-muted-foreground">@{person.username}</p>
          {person.about && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{person.about}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          {isContact ? (
            <Button disabled type="button" variant="outline">
              Added
            </Button>
          ) : (
            <Button disabled={isPending} onClick={onAdd} type="button" variant="outline">
              <UserPlus aria-hidden="true" />
              Add
            </Button>
          )}
          <Button aria-label={`Message ${person.name}`} onClick={onMessage} size="icon" type="button">
            <MessageCircle aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Status({ children, role }: { children: ReactNode; role?: 'alert' }) {
  return (
    <p className="rounded-xl border bg-background px-5 py-8 text-center text-sm text-muted-foreground" role={role}>
      {children}
    </p>
  );
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
