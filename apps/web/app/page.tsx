import Link from 'next/link';
import { useTranslations } from 'next-intl';

import Footer from '@/components/core/footer';
import Header from '@/components/core/header';
import { LanguageToggle } from '@/components/core/language-toggle';
import { ThemeToggle } from '@/components/core/theme-toggle';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-5 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
          Make room for better conversations
        </p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">{t('title')}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          A thoughtful place to message people, find your conversations, and stay connected with your communities.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            href="/register"
          >
            Get started
          </Link>
          <Link className="rounded-md border bg-background px-5 py-3 text-sm font-medium hover:bg-muted" href="/login">
            Sign in
          </Link>
        </div>
        <section aria-label="Convo features" className="mt-20 grid w-full gap-4 text-left sm:grid-cols-3">
          <Feature title="Your conversations" description="Keep direct messages and group chats easy to find." />
          <Feature title="Find what matters" description="Search across messages, people, and shared conversations." />
          <Feature
            title="Stay in control"
            description="Manage your profile, privacy, and account settings in one place."
          />
        </section>
        <div className="mt-8 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-xl border bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
