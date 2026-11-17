'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { searchMessagesParamsSchema, type TMessage, type TUser } from '@repo/shared';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SearchAttachment = { id: string; type: string; file_name: string | null; mime_type: string };
type SearchMessage = Pick<TMessage, 'id' | 'conversation_id' | 'type' | 'content' | 'created_at'> & {
  sender: Pick<TUser, 'id' | 'username' | 'name' | 'avatar_url'>;
  conversation: { id: string; name: string | null; type: string };
  attachments: SearchAttachment[];
};
type SearchResponse = {
  success?: boolean;
  message?: string;
  data?: {
    data: SearchMessage[];
    page: number;
    total: number;
    totalPages: number;
  };
};

const messageSearchFormSchema = z
  .object({
    q: searchMessagesParamsSchema.shape.q,
    sender: z
      .string()
      .max(100)
      .refine((value) => !value.trim() || value.trim().length >= 2, 'Enter at least 2 characters for the sender.')
      .transform((value) => value.trim() || undefined),
    from: z.string().optional(),
    to: z.string().optional(),
    attachmentType: z
      .enum(['', 'image', 'video', 'audio', 'document'])
      .transform((value) => (value === '' ? undefined : value)),
  })
  .refine((values) => !values.from || !values.to || values.from <= values.to, {
    message: 'The start date must be before the end date.',
    path: ['to'],
  });

type MessageSearchValues = z.output<typeof messageSearchFormSchema>;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function SearchPage() {
  const [searchCriteria, setSearchCriteria] = useState<MessageSearchValues | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [results, setResults] = useState<SearchMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const form = useForm<z.input<typeof messageSearchFormSchema>, unknown, MessageSearchValues>({
    resolver: zodResolver(messageSearchFormSchema),
    defaultValues: { q: '', sender: '', from: '', to: '', attachmentType: '' },
  });
  const formErrors = form.formState.errors;

  async function search(targetPage: number, criteria: MessageSearchValues) {
    const input: z.input<typeof searchMessagesParamsSchema> = {
      q: criteria.q,
      page: targetPage,
      limit: 20,
      ...(criteria.sender ? { sender: criteria.sender } : {}),
      ...(criteria.from ? { from: dateBoundary(criteria.from, false) } : {}),
      ...(criteria.to ? { to: dateBoundary(criteria.to, true) } : {}),
      ...(criteria.attachmentType ? { attachmentType: criteria.attachmentType } : {}),
    };
    const parsed = searchMessagesParamsSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the search filters and try again.');
      return;
    }

    const params = new URLSearchParams({
      q: parsed.data.q,
      page: String(parsed.data.page ?? targetPage),
      limit: String(parsed.data.limit ?? 20),
    });
    if (parsed.data.sender) params.set('sender', parsed.data.sender);
    if (parsed.data.from) params.set('from', parsed.data.from.toISOString());
    if (parsed.data.to) params.set('to', parsed.data.to.toISOString());
    if (parsed.data.attachmentType) params.set('attachmentType', parsed.data.attachmentType);

    setError(null);
    setRequiresLogin(false);
    setIsSearching(true);
    try {
      const response = await fetch(`/api/messages/search?${params.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as SearchResponse;
      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.message ?? 'Could not search messages.');
        setRequiresLogin(response.status === 401);
        setResults([]);
        setTotal(0);
        setHasSearched(false);
        setPage(1);
        setTotalPages(0);
        return;
      }
      setResults(payload.data.data);
      setTotal(payload.data.total);
      setPage(payload.data.page);
      setTotalPages(payload.data.totalPages);
      setSearchedQuery(criteria.q);
      setSearchCriteria(criteria);
      setHasSearched(true);
    } catch {
      setError('Could not reach the search service. Please try again.');
      setResults([]);
      setTotal(0);
      setPage(1);
      setTotalPages(0);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <header className="rounded-[1.75rem] bg-gradient-to-br from-[#063f35] via-[#087e64] to-[#25a87e] px-6 py-7 text-white shadow-xl shadow-primary/15 sm:px-9 sm:py-9">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-50/80 uppercase">Find a moment</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Search messages</h1>
        <p className="mt-2 text-sm text-emerald-50/85">Find messages across conversations you belong to.</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit((values) => {
              setSearchCriteria(values);
              void search(1, values);
            })}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="message-query">Message text</Label>
              <Input
                autoComplete="off"
                aria-describedby={formErrors.q ? 'message-query-error' : undefined}
                aria-invalid={Boolean(formErrors.q)}
                className="h-11 rounded-xl bg-background/70 px-3"
                id="message-query"
                maxLength={100}
                placeholder="Search messages…"
                {...form.register('q')}
              />
              {formErrors.q?.message && <FieldError id="message-query-error">{formErrors.q.message}</FieldError>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sender">Sender</Label>
                <Input
                  autoComplete="off"
                  aria-describedby={formErrors.sender ? 'sender-error' : undefined}
                  aria-invalid={Boolean(formErrors.sender)}
                  className="h-11 rounded-xl bg-background/70 px-3"
                  id="sender"
                  maxLength={100}
                  placeholder="Name or username"
                  {...form.register('sender')}
                />
                {formErrors.sender?.message && <FieldError id="sender-error">{formErrors.sender.message}</FieldError>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="from-date">From date</Label>
                <Input
                  aria-describedby={formErrors.from ? 'from-date-error' : undefined}
                  aria-invalid={Boolean(formErrors.from)}
                  className="h-11 rounded-xl bg-background/70 px-3"
                  id="from-date"
                  type="date"
                  {...form.register('from')}
                />
                {formErrors.from?.message && <FieldError id="from-date-error">{formErrors.from.message}</FieldError>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="to-date">To date</Label>
                <Input
                  aria-describedby={formErrors.to ? 'to-date-error' : undefined}
                  aria-invalid={Boolean(formErrors.to)}
                  className="h-11 rounded-xl bg-background/70 px-3"
                  id="to-date"
                  type="date"
                  {...form.register('to')}
                />
                {formErrors.to?.message && <FieldError id="to-date-error">{formErrors.to.message}</FieldError>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attachment-type">Attachment</Label>
                <select
                  className="h-11 rounded-xl border border-input bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="attachment-type"
                  {...form.register('attachmentType')}
                >
                  <option value="">Any type</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-5 font-semibold shadow-lg shadow-primary/15 hover:brightness-105"
                disabled={isSearching}
                type="submit"
              >
                <Search aria-hidden="true" />
                {isSearching ? 'Searching…' : 'Search messages'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          aria-live="polite"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          <p>{error}</p>
          {requiresLogin && (
            <Link className="mt-2 inline-block font-medium underline underline-offset-4" href="/login">
              Sign in
            </Link>
          )}
        </div>
      )}

      {results.length > 0 && (
        <section aria-label="Search results" className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {total} result{total === 1 ? '' : 's'}
            </p>
            <p>
              Page {page} of {totalPages}
            </p>
          </div>
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="gap-3 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{result.sender.name}</span>
                    <span className="text-xs text-muted-foreground">@{result.sender.username}</span>
                    <span className="text-xs text-muted-foreground">
                      in{' '}
                      {result.conversation.name ??
                        (result.conversation.type === 'private' ? 'Direct message' : 'Conversation')}
                    </span>
                  </div>
                  <time className="text-xs text-muted-foreground" dateTime={String(result.created_at)}>
                    {dateFormatter.format(new Date(String(result.created_at)))}
                  </time>
                </div>
                {result.content && (
                  <p className="text-sm leading-6 break-words whitespace-pre-wrap">
                    {highlightMatch(result.content, searchedQuery)}
                  </p>
                )}
                {result.attachments.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {result.attachments.map((attachment) => (
                      <li
                        className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                        key={attachment.id}
                      >
                        {attachment.file_name ?? attachment.type}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
          <nav aria-label="Search result pages" className="flex items-center justify-center gap-3 pt-2">
            <Button
              className="rounded-xl"
              disabled={isSearching || page <= 1 || !searchCriteria}
              onClick={() => searchCriteria && void search(page - 1, searchCriteria)}
              type="button"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              className="rounded-xl"
              disabled={isSearching || page >= totalPages || !searchCriteria}
              onClick={() => searchCriteria && void search(page + 1, searchCriteria)}
              type="button"
              variant="outline"
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        </section>
      )}

      {!isSearching && !error && results.length === 0 && total === 0 && (
        <p className="rounded-2xl border border-border/70 bg-card/60 px-5 py-8 text-center text-sm text-muted-foreground">
          {hasSearched
            ? 'No messages matched those search terms and filters.'
            : 'Enter a phrase to search your conversation history.'}
        </p>
      )}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="text-xs font-medium text-destructive" id={id}>
      {children}
    </p>
  );
}

function dateBoundary(date: string, endOfDay: boolean): string {
  return new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00'}`).toISOString();
}

function highlightMatch(content: string, query: string) {
  if (!query) return content;
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return content;
  return (
    <>
      {content.slice(0, index)}
      <mark className="rounded bg-primary/15 px-0.5 text-foreground">{content.slice(index, index + query.length)}</mark>
      {content.slice(index + query.length)}
    </>
  );
}
