'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">The page could not be loaded. Try again, or return home.</p>
      <Button onClick={reset} type="button">
        Try again
      </Button>
      <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href="/">
        Return home
      </Link>
    </main>
  );
}
