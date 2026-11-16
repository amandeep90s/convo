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

import { Card, CardContent } from '@/components/ui/card';

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
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your profile, preferences, and account security.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {settingsSections.map(({ href, title, description, icon: Icon }) => (
          <Link
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            href={href}
            key={href}
          >
            <Card className="h-full transition-colors hover:bg-muted/30">
              <CardContent className="flex-row items-start gap-4">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{title}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
                </span>
                <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
