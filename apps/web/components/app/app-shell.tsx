'use client';

import { Archive, AudioLines, ContactRound, MessageCircle, Search, Settings, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { LogoutButton } from '@/components/app/logout-button';
import { useCurrentUser } from '@/lib/client/use-current-user';

const navigation = [
  { href: '/chat', label: 'Chats', icon: MessageCircle },
  { href: '/contacts', label: 'Contacts', icon: ContactRound },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/calls', label: 'Calls', icon: AudioLines },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/starred', label: 'Starred', icon: Star },
  { href: '/archived', label: 'Archived', icon: Archive },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r bg-background p-4 md:flex md:flex-col">
          <Link className="mb-8 px-3 text-xl font-bold tracking-tight" href="/chat">
            convo<span className="text-primary">.</span>
          </Link>
          <AppNavigation pathname={pathname} />
          <div className="mt-auto border-t pt-4">
            <UserSummary isError={isError} isPending={isPending} name={user?.name} username={user?.username} />
            <LogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <details className="relative">
                <summary className="cursor-pointer list-none rounded-md border px-3 py-2 text-sm font-medium">
                  Menu
                </summary>
                <div className="absolute top-12 left-0 z-30 w-64 rounded-xl border bg-background p-3 shadow-xl">
                  <AppNavigation pathname={pathname} />
                </div>
              </details>
              <Link className="font-bold" href="/chat">
                convo<span className="text-primary">.</span>
              </Link>
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">{getPageTitle(pathname)}</p>
            <div className="flex items-center gap-3">
              <UserSummary
                compact
                isError={isError}
                isPending={isPending}
                name={user?.name}
                username={user?.username}
              />
              <div className="md:hidden">
                <LogoutButton iconOnly />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function AppNavigation({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSummary({
  name,
  username,
  isPending,
  isError,
  compact = false,
}: {
  name?: string;
  username?: string;
  isPending: boolean;
  isError: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`min-w-0 ${compact ? 'max-w-40 text-right' : 'mb-3'}`}>
      <p className="truncate text-sm font-medium">
        {isPending ? 'Loading account…' : isError ? 'Account unavailable' : (name ?? 'Convo member')}
      </p>
      {!compact && username && <p className="truncate text-xs text-muted-foreground">@{username}</p>}
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const item = navigation.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  return item?.label ?? 'Convo';
}
