import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">This link may be incorrect or the page may have moved.</p>
      <Link className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline" href="/">
        Return home
      </Link>
    </main>
  );
}
