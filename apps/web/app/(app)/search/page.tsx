'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type SearchAttachment = {
  id: string;
  type: string;
  file_name: string | null;
  mime_type: string;
};

type SearchMessage = {
  id: string;
  conversation_id: string;
  type: string;
  content: string | null;
  created_at: string;
  sender: { id: string; username: string; name: string; avatar_url: string | null };
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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [sender, setSender] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [attachmentType, setAttachmentType] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [results, setResults] = useState<SearchMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function search(targetPage: number) {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      setError('Enter at least 2 characters to search.');
      setResults([]);
      setTotal(0);
      setPage(1);
      setTotalPages(0);
      setHasSearched(false);
      return;
    }
    if (sender.trim().length === 1) {
      setError('Enter at least 2 characters for the sender filter.');
      setResults([]);
      setTotal(0);
      setPage(1);
      setTotalPages(0);
      setHasSearched(false);
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      setError('The start date must be before the end date.');
      setResults([]);
      setTotal(0);
      setPage(1);
      setTotalPages(0);
      setHasSearched(false);
      return;
    }

    const params = new URLSearchParams({ q: searchTerm, page: String(targetPage), limit: '20' });
    if (sender.trim()) params.set('sender', sender.trim());
    if (fromDate) params.set('from', dateBoundary(fromDate, false));
    if (toDate) params.set('to', dateBoundary(toDate, true));
    if (attachmentType) params.set('attachmentType', attachmentType);

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
      setSearchedQuery(searchTerm);
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

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await search(1);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Search messages</h1>
          <p className="mt-2 text-sm text-muted-foreground">Find messages across conversations you belong to.</p>
        </div>
      </header>

      <Card>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={submitSearch}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="message-query">
                Message text
              </label>
              <Input
                autoComplete="off"
                id="message-query"
                maxLength={100}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search messages..."
                value={query}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="sender">
                  Sender
                </label>
                <Input
                  autoComplete="off"
                  id="sender"
                  maxLength={100}
                  onChange={(event) => setSender(event.target.value)}
                  placeholder="Name or username"
                  value={sender}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="from-date">
                  From date
                </label>
                <Input
                  id="from-date"
                  onChange={(event) => setFromDate(event.target.value)}
                  type="date"
                  value={fromDate}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="to-date">
                  To date
                </label>
                <Input id="to-date" onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="attachment-type">
                  Attachment
                </label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  id="attachment-type"
                  onChange={(event) => setAttachmentType(event.target.value)}
                  value={attachmentType}
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
              <Button disabled={isSearching} type="submit">
                <Search aria-hidden="true" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          aria-live="polite"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
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
              <CardContent className="gap-3">
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
                  <time className="text-xs text-muted-foreground" dateTime={result.created_at}>
                    {dateFormatter.format(new Date(result.created_at))}
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
              disabled={isSearching || page <= 1}
              onClick={() => void search(page - 1)}
              type="button"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              disabled={isSearching || page >= totalPages}
              onClick={() => void search(page + 1)}
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
        <p className="py-8 text-center text-sm text-muted-foreground">
          {hasSearched
            ? 'No messages matched those search terms and filters.'
            : 'Enter a message phrase to search your conversation history.'}
        </p>
      )}
    </main>
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
