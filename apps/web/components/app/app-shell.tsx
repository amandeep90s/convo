'use client';

import {
  Archive,
  AudioLines,
  ContactRound,
  Menu,
  MessageCircle,
  Monitor,
  Search,
  Settings,
  Shield,
  Star,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { ConversationList } from '@/components/app/conversation-list';
import { LogoutButton } from '@/components/app/logout-button';
import { ThemeToggle } from '@/components/core/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

const settingsNavigation = [
  { href: '/settings/profile', label: 'Profile', icon: ContactRound },
  { href: '/settings/account', label: 'Account', icon: Settings },
  { href: '/settings/privacy', label: 'Privacy', icon: Shield },
  { href: '/settings/notifications', label: 'Notifications', icon: AudioLines },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/devices', label: 'Devices', icon: Monitor },
  { href: '/settings/appearance', label: 'Appearance', icon: Monitor },
  { href: '/settings/language', label: 'Language', icon: ContactRound },
  { href: '/settings/chats', label: 'Chats', icon: MessageCircle },
  { href: '/settings/media', label: 'Media', icon: MessageCircle },
  { href: '/settings/storage', label: 'Storage', icon: Archive },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();
  const isChat = pathname === '/chat' || pathname.startsWith('/chat/');
  const isConversation = pathname.startsWith('/chat/');
  const isSettingsSection = pathname.startsWith('/settings/') && pathname !== '/settings/';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf0ed] lg:p-4 dark:bg-[#101b20]" data-private-app>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(8,126,100,0.12),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(86,174,141,0.12),transparent_40%)]"
      />
      <div
        className={`relative mx-auto flex max-w-[1680px] overflow-hidden border border-white/60 bg-background/95 shadow-[0_30px_90px_-42px_rgba(13,74,57,0.38)] lg:rounded-[1.75rem] dark:border-white/10 ${
          isChat ? 'h-dvh lg:h-[calc(100dvh-2rem)]' : 'min-h-dvh lg:min-h-[calc(100dvh-2rem)]'
        }`}
      >
        <aside className="hidden w-[76px] shrink-0 flex-col border-r border-border/70 bg-background/75 px-2 py-5 backdrop-blur-xl md:flex lg:w-64 lg:px-4">
          <Link
            aria-label="Convo home"
            className="mb-8 flex items-center justify-center gap-3 lg:justify-start lg:px-2"
            href="/chat"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#087e64] to-[#31bd90] text-white shadow-lg shadow-primary/20">
              <MessageCircle aria-hidden="true" className="size-5" />
            </span>
            <span className="hidden text-xl font-semibold tracking-tight lg:inline">
              convo<span className="text-primary">.</span>
            </span>
          </Link>

          <p className="mb-2 hidden px-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase lg:block">
            Workspace
          </p>
          <AppNavigation pathname={pathname} />

          <div className="mt-auto border-t border-border/70 pt-4">
            <Link
              className="mb-3 hidden min-w-0 items-center gap-3 rounded-2xl bg-muted/60 p-3 transition-colors hover:bg-muted lg:flex"
              href="/settings/profile"
            >
              <UserAvatar name={user?.name} isPending={isPending} isError={isError} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {isPending ? 'Loading account…' : isError ? 'Account unavailable' : (user?.name ?? 'Convo member')}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user?.username ? `@${user.username}` : 'Your profile'}
                </span>
              </span>
            </Link>
            <LogoutButton iconOnly />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="relative z-20 flex min-h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="md:hidden">
                <MobileNavigation pathname={pathname} />
              </div>
              <Link className="font-semibold tracking-tight md:hidden" href="/chat">
                convo<span className="text-primary">.</span>
              </Link>
              <p className="hidden truncate text-sm font-medium text-muted-foreground md:block">
                {getPageTitle(pathname)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link
                aria-label="Open your profile settings"
                className="flex min-w-0 items-center gap-2 rounded-full transition-colors hover:bg-muted sm:rounded-2xl sm:py-1 sm:pr-3 sm:pl-1"
                href="/settings/profile"
              >
                <UserAvatar name={user?.name} isPending={isPending} isError={isError} />
                <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                  {isPending ? 'Loading…' : isError ? 'Account unavailable' : (user?.name ?? 'Your profile')}
                </span>
              </Link>
              <div className="md:hidden">
                <LogoutButton iconOnly />
              </div>
            </div>
          </header>

          {isChat ? (
            <main className="flex min-h-0 min-w-0 flex-1">
              <div
                className={`${
                  isConversation ? 'hidden md:flex' : 'flex'
                } w-full min-w-0 flex-col border-r border-border/70 md:w-[340px] md:shrink-0 lg:w-[390px]`}
              >
                <ConversationList mode="recent" />
              </div>
              <div className={`${isConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>{children}</div>
            </main>
          ) : (
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {isSettingsSection ? (
                <div className="mx-auto grid w-full max-w-[1320px] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-9">
                  <SettingsNavigation pathname={pathname} />
                  <div className="min-w-0">{children}</div>
                </div>
              ) : (
                children
              )}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

function AppNavigation({
  pathname,
  onNavigate,
  expanded = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  expanded?: boolean;
}) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors md:justify-center lg:justify-start ${
              active
                ? 'bg-gradient-to-r from-[#087e64] to-[#0d9870] text-white shadow-md shadow-primary/15'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
            title={label}
          >
            <Icon aria-hidden="true" className="size-[18px] shrink-0" />
            <span className={expanded ? 'inline' : 'hidden lg:inline'}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SettingsNavigation({ pathname }: { pathname: string }) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <Settings aria-hidden="true" className="size-3.5" />
        Preferences
      </div>
      <nav
        aria-label="Settings navigation"
        className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible"
      >
        {settingsNavigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/15'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileNavigation({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        aria-controls="mobile-app-navigation"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="rounded-xl border-border/70 bg-background shadow-sm"
        onClick={() => setIsOpen((open) => !open)}
        size="icon"
        variant="outline"
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </Button>
      {isOpen && (
        <div
          className="absolute top-12 left-0 z-30 w-64 rounded-2xl border border-border/70 bg-background p-3 shadow-2xl"
          id="mobile-app-navigation"
        >
          <AppNavigation expanded pathname={pathname} onNavigate={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}

function UserAvatar({ name, isPending, isError }: { name?: string; isPending: boolean; isError: boolean }) {
  const initials = isPending || isError ? 'C' : name?.trim().charAt(0).toUpperCase() || 'C';
  return (
    <Avatar className="size-9 border border-white/70 bg-gradient-to-br from-emerald-100 to-teal-200 text-primary dark:border-white/10 dark:from-emerald-950 dark:to-teal-900">
      <AvatarFallback className="bg-transparent font-semibold text-primary">{initials}</AvatarFallback>
    </Avatar>
  );
}

function getPageTitle(pathname: string): string {
  const item = navigation.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  if (item) return item.label;
  const settingsItem = settingsNavigation.find(({ href }) => pathname === href);
  return settingsItem?.label ?? (pathname.startsWith('/settings') ? 'Settings' : 'Convo');
}
