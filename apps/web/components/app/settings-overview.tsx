import {
  ArrowRight,
  Bell,
  Eye,
  HardDrive,
  Image,
  KeyRound,
  Languages,
  MessageCircle,
  Monitor,
  Shield,
  Smartphone,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';

const settingsSections = [
  {
    href: '/settings/profile',
    title: 'Profile',
    description: 'Update your name, username, and about information.',
    icon: UserRound,
  },
  {
    href: '/settings/account',
    title: 'Account',
    description: 'Review your email verification and password recovery options.',
    icon: KeyRound,
  },
  {
    href: '/settings/privacy',
    title: 'Privacy',
    description: 'Choose who can see your profile and presence.',
    icon: Eye,
  },
  {
    href: '/settings/notifications',
    title: 'Notifications',
    description: 'Manage your account notification preference.',
    icon: Bell,
  },
  {
    href: '/settings/security',
    title: 'Security',
    description: 'Review active sessions and revoke access you no longer recognize.',
    icon: Shield,
  },
  {
    href: '/settings/devices',
    title: 'Devices',
    description: 'Review and revoke registered devices.',
    icon: Smartphone,
  },
  {
    href: '/settings/appearance',
    title: 'Appearance',
    description: 'Set the preferred theme and language.',
    icon: Monitor,
  },
  {
    href: '/settings/language',
    title: 'Language',
    description: 'Choose the language preference for your account.',
    icon: Languages,
  },
  {
    href: '/settings/chats',
    title: 'Chats',
    description: 'Manage read receipt preferences for conversations.',
    icon: MessageCircle,
  },
  {
    href: '/settings/media',
    title: 'Media',
    description: 'Review the current file-sharing capabilities.',
    icon: Image,
  },
  {
    href: '/settings/storage',
    title: 'Storage',
    description: 'Review storage management availability.',
    icon: HardDrive,
  },
] as const;

export function SettingsOverview() {
  const text = useUiText();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#063f35] via-[#087e64] to-[#25a87e] px-6 py-7 text-white shadow-xl shadow-primary/15 sm:px-9 sm:py-9">
        <div aria-hidden="true" className="absolute -top-20 -right-10 size-64 rounded-full border border-white/15" />
        <div aria-hidden="true" className="absolute right-24 -bottom-28 size-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-50/80 uppercase">
            {text('Your workspace')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{text('Settings')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/85">
            {text('Make Convo feel like yours. Manage your profile, preferences, and account security.')}
          </p>
        </div>
      </header>
      <section aria-label={text('Settings categories')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map(({ href, title, description, icon: Icon }) => (
          <Link
            className="group rounded-[1.3rem] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            href={href}
            key={href}
          >
            <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:bg-primary/[0.025]">
              <CardHeader className="flex-row items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-emerald-200/50 text-primary dark:to-emerald-900/40">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{text(title)}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </span>
                  <span className="mt-1.5 block text-sm leading-5 text-muted-foreground">{text(description)}</span>
                </span>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
      <Card className="bg-gradient-to-r from-primary/[0.06] to-transparent">
        <CardContent className="flex-row items-center gap-3 py-4">
          <Shield aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            {text('Your account preferences are saved to your profile and used across your signed-in sessions.')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
