export default function Loading() {
  return (
    <main
      aria-label="Loading page"
      className="mx-auto flex min-h-[50vh] w-full max-w-5xl flex-col gap-4 px-6 py-10"
      role="status"
    >
      <span className="sr-only">Loading page</span>
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="mt-4 h-40 animate-pulse rounded-xl border bg-muted/40" />
    </main>
  );
}
