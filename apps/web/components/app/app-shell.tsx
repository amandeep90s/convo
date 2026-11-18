'use client';

import type { ConversationEvent, RealtimeMessage } from '@repo/shared';
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
import { useCallback, useState } from 'react';

import { ChatActivityProvider } from '@/components/app/chat-activity';
import { ConversationList } from '@/components/app/conversation-list';
import { LogoutButton } from '@/components/app/logout-button';
import { NotificationBell, type NotificationItem } from '@/components/app/notification-bell';
import { RealtimeUpdates } from '@/components/app/realtime-updates';
import { LanguageToggle } from '@/components/core/language-toggle';
import { ThemeToggle } from '@/components/core/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';
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
  return (
    <ChatActivityProvider>
      <AppShellContent>{children}</AppShellContent>
    </ChatActivityProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const text = useUiText();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const receiveNotification = useCallback((message: RealtimeMessage) => {
    setNotifications((items) =>
      items.some((item) => item.message.id === message.id) ? items : [{ message, read: false }, ...items].slice(0, 50),
    );
  }, []);
  const removeNotification = useCallback((event: ConversationEvent & { id?: string }) => {
    setNotifications((items) =>
      items.filter(({ message }) =>
        event.id ? message.id !== event.id : message.conversation_id !== event.conversation_id,
      ),
    );
  }, []);
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
        <aside className="hidden w-19 shrink-0 flex-col border-r border-border/70 bg-background/75 px-2 py-5 backdrop-blur-xl md:flex lg:w-72 lg:px-4">
          <Link
            aria-label={text('Convo home')}
            className="mb-8 flex items-center justify-center gap-3 lg:justify-start lg:px-2"
            href="/chat"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-[#087e64] to-[#31bd90] text-white shadow-lg shadow-primary/20">
              <MessageCircle aria-hidden="true" className="size-5" />
            </span>
            <span className="hidden text-xl font-semibold tracking-tight lg:inline">
              convo<span className="text-primary">.</span>
            </span>
          </Link>

          <p className="mb-2 hidden px-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase lg:block">
            {text('Workspace')}
          </p>
          <AppNavigation pathname={pathname} />

          <div className="mt-auto border-t border-border/70 pt-4">
            <div className="flex items-center gap-2 lg:rounded-2xl lg:bg-muted/60 lg:p-2">
              <Link
                className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted lg:flex"
                href="/settings/profile"
              >
                <UserAvatar avatarUrl={user?.avatar_url} name={user?.name} isPending={isPending} isError={isError} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {isPending
                      ? text('Loading account…')
                      : isError
                        ? text('Account unavailable')
                        : (user?.name ?? text('Convo member'))}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user?.username ? `@${user.username}` : text('Your profile')}
                  </span>
                </span>
              </Link>
              <div className="shrink-0">
                <LogoutButton iconOnly />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <RealtimeUpdates onNotification={receiveNotification} onContentRemoved={removeNotification} />
          <header className="relative z-20 flex min-h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="md:hidden">
                <MobileNavigation pathname={pathname} />
              </div>
              <Link className="hidden font-semibold tracking-tight min-[400px]:inline md:hidden" href="/chat">
                convo<span className="text-primary">.</span>
              </Link>
              <p className="hidden truncate text-sm font-medium text-muted-foreground md:block">
                {text(getPageTitle(pathname))}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell
                items={notifications}
                onRead={(id) =>
                  setNotifications((items) =>
                    items.map((item) => (item.message.id === id ? { ...item, read: true } : item)),
                  )
                }
                onReadAll={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))}
              />
              <LanguageToggle />
              <ThemeToggle persist />
              <Link
                aria-label={text('Open your profile settings')}
                className="flex min-w-0 items-center gap-2 rounded-full transition-colors hover:bg-muted sm:rounded-2xl sm:py-1 sm:pr-3 sm:pl-1"
                href="/settings/profile"
              >
                <UserAvatar avatarUrl={user?.avatar_url} name={user?.name} isPending={isPending} isError={isError} />
                <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                  {isPending
                    ? text('Loading…')
                    : isError
                      ? text('Account unavailable')
                      : (user?.name ?? text('Your profile'))}
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
                } w-full min-w-0 flex-col border-r border-border/70 md:w-85 md:shrink-0 lg:w-97.5`}
              >
                <ConversationList mode="recent" />
              </div>
              <div className={`${isConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>{children}</div>
            </main>
          ) : (
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {isSettingsSection ? (
                <div className="mx-auto grid w-full max-w-330 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-9">
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
  const text = useUiText();
  return (
    <nav aria-label={text('Main navigation')} className="flex flex-col gap-1.5">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors md:justify-center lg:justify-start ${
              active
                ? 'bg-linear-to-r from-[#087e64] to-[#0d9870] text-white shadow-md shadow-primary/15'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
            title={text(label)}
          >
            <Icon aria-hidden="true" className="size-4.5 shrink-0" />
            <span className={expanded ? 'inline' : 'hidden lg:inline'}>{text(label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SettingsNavigation({ pathname }: { pathname: string }) {
  const text = useUiText();
  return (
    <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <Settings aria-hidden="true" className="size-3.5" />
        {text('Preferences')}
      </div>
      <nav
        aria-label={text('Settings navigation')}
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
              {text(label)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileNavigation({ pathname }: { pathname: string }) {
  const text = useUiText();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        aria-controls="mobile-app-navigation"
        aria-expanded={isOpen}
        aria-label={isOpen ? text('Close navigation menu') : text('Open navigation menu')}
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

function UserAvatar({
  avatarUrl,
  name,
  isPending,
  isError,
}: {
  avatarUrl?: string | null;
  name?: string;
  isPending: boolean;
  isError: boolean;
}) {
  const initials = isPending || isError ? 'C' : name?.trim().charAt(0).toUpperCase() || 'C';
  return (
    <Avatar className="size-9 border border-white/70 bg-linear-to-br from-emerald-100 to-teal-200 text-primary dark:border-white/10 dark:from-emerald-950 dark:to-teal-900">
      <AvatarImage alt="" src={avatarUrl || undefined} />
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
