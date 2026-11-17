'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const text = useUiText();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{text('Something went wrong')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {text('The page could not be loaded. Try again, or return home.')}
      </p>
      <Button onClick={reset} type="button">
        {text('Try again')}
      </Button>
      <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href="/">
        {text('Return home')}
      </Link>
    </main>
  );
}
