'use client';

import Link from 'next/link';

import { usePublicSession } from '@/components/auth/public-session';
import { LanguageToggle } from '@/components/core/language-toggle';
import { ThemeToggle } from '@/components/core/theme-toggle';
import { useUiText } from '@/i18n/ui-text';

export default function Header() {
  const text = useUiText();
  const signedIn = usePublicSession();
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-background/60 px-6 py-4 backdrop-blur-xl">
      <Link className="text-xl font-bold tracking-tight" href="/">
        convo<span className="text-primary">.</span>
      </Link>
      <nav aria-label={text('Account navigation')} className="flex items-center gap-4 text-sm">
        <LanguageToggle />
        <ThemeToggle />
        {signedIn !== null && (
          <>
            <Link className="text-muted-foreground hover:text-foreground" href={signedIn ? '/chat' : '/login'}>
              {text(signedIn ? 'Chats' : 'Sign in')}
            </Link>
            <Link className="font-medium text-primary hover:underline" href={signedIn ? '/settings' : '/register'}>
              {text(signedIn ? 'Settings' : 'Create account')}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
