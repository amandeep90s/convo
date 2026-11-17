'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateContactDto, TUser } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Search, UserPlus, UserRoundMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

type Person = Pick<TUser, 'id' | 'name' | 'username' | 'about' | 'avatar_url'>;
type Contact = { contact_user_id: string; nickname: string | null; contact_user: Person };
type PageResponse<T> = { data: T[]; total: number };

const contactSearchSchema = z.object({
  query: z.string().trim().min(2, 'Enter at least 2 characters to search for people.').max(100),
});

export function ContactManager() {
  const text = useUiText();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const searchForm = useForm<z.input<typeof contactSearchSchema>, unknown, z.output<typeof contactSearchSchema>>({
    resolver: zodResolver(contactSearchSchema),
    defaultValues: { query: '' },
  });

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
    mutationFn: (body: CreateContactDto) => apiRequest('contacts', { method: 'POST', body }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (reason) => setError(toMessage(reason, text('Could not add this contact.'))),
  });
  const removeContact = useMutation({
    mutationFn: (userId: string) => apiRequest(`contacts/${userId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (reason) => setError(toMessage(reason, text('Could not remove this contact.'))),
  });

  function submitSearch({ query }: z.output<typeof contactSearchSchema>) {
    setError(null);
    setSubmittedSearch(query);
  }

  async function startConversation(personId: string) {
    if (!currentUser) {
      setError(text('Your account could not be loaded. Refresh the page and try again.'));
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
      setError(toMessage(reason, text('Could not start this conversation.')));
    }
  }

  const contactIds = new Set((contacts.data?.data ?? []).map(({ contact_user_id }) => contact_user_id));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <header className="rounded-[1.75rem] bg-gradient-to-br from-[#063f35] via-[#087e64] to-[#25a87e] px-6 py-7 text-white shadow-xl shadow-primary/15 sm:px-9 sm:py-9">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-50/80 uppercase">{text('Your people')}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{text('Contacts')}</h1>
        <p className="mt-2 text-sm text-emerald-50/85">{text('Find people and start a private conversation.')}</p>
      </header>

      <Card>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={searchForm.handleSubmit(submitSearch)}>
            <Input
              aria-label={text('Search people')}
              aria-invalid={Boolean(searchForm.formState.errors.query)}
              aria-describedby={searchForm.formState.errors.query ? 'contact-search-error' : undefined}
              className="h-11 rounded-xl bg-background/70 px-3"
              maxLength={100}
              placeholder={text('Search by name or username')}
              {...searchForm.register('query')}
            />
            <Button
              className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-5 font-semibold shadow-lg shadow-primary/15 hover:brightness-105"
              disabled={users.isFetching}
              type="submit"
            >
              <Search aria-hidden="true" />
              {users.isFetching ? text('Searching…') : text('Find people')}
            </Button>
          </form>
          {searchForm.formState.errors.query?.message && (
            <p className="mt-2 text-xs font-medium text-destructive" id="contact-search-error">
              {text(searchForm.formState.errors.query.message)}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {text(error)}
        </p>
      )}

      {submittedSearch && (
        <section className="flex flex-col gap-3" aria-labelledby="people-results-title">
          <h2 className="text-lg font-semibold" id="people-results-title">
            {text('People')}
          </h2>
          {users.isPending && <Status>{text('Searching people…')}</Status>}
          {users.isError && <Status role="alert">{text(users.error.message)}</Status>}
          {users.isSuccess && users.data.data.length === 0 && <Status>{text('No people match that search.')}</Status>}
          {users.isSuccess &&
            users.data.data.map((person) => (
              <PersonCard
                isContact={contactIds.has(person.id)}
                isPending={addContact.isPending && addContact.variables?.contact_user_id === person.id}
                key={person.id}
                onAdd={() => addContact.mutate({ contact_user_id: person.id })}
                onMessage={() => void startConversation(person.id)}
                person={person}
              />
            ))}
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="contacts-title">
        <h2 className="text-lg font-semibold" id="contacts-title">
          {text('Your contacts')}
        </h2>
        {contacts.isPending && <Status>{text('Loading contacts…')}</Status>}
        {contacts.isError && <Status role="alert">{text(contacts.error.message)}</Status>}
        {contacts.isSuccess && contacts.data.data.length === 0 && (
          <Status>{text('No contacts yet. Search for someone to add.')}</Status>
        )}
        {contacts.isSuccess &&
          contacts.data.data.map(({ contact_user: person, nickname }) => (
            <Card key={person.id}>
              <CardContent className="flex-row items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{nickname || person.name}</p>
                  <p className="truncate text-sm text-muted-foreground">@{person.username}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    aria-label={text('Message {value0}', { value0: person.name })}
                    onClick={() => void startConversation(person.id)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <MessageCircle aria-hidden="true" />
                  </Button>
                  <Button
                    aria-label={text('Remove {value0} from contacts', { value0: person.name })}
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
  const text = useUiText();
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
              {text('Added')}
            </Button>
          ) : (
            <Button className="rounded-xl" disabled={isPending} onClick={onAdd} type="button" variant="outline">
              <UserPlus aria-hidden="true" />
              {text('Add')}
            </Button>
          )}
          <Button
            aria-label={text('Message {value0}', { value0: person.name })}
            onClick={onMessage}
            size="icon"
            type="button"
          >
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
