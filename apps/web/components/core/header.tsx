import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link className="text-xl font-bold tracking-tight" href="/">
        convo<span className="text-primary">.</span>
      </Link>
      <nav aria-label="Account navigation" className="flex items-center gap-4 text-sm">
        <Link className="text-muted-foreground hover:text-foreground" href="/login">
          Sign in
        </Link>
        <Link className="font-medium text-primary hover:underline" href="/register">
          Create account
        </Link>
      </nav>
    </header>
  );
}
