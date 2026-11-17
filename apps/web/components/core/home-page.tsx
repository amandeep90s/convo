'use client';

import {
  ArrowRight,
  Bell,
  CheckCheck,
  FileText,
  Fingerprint,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { usePublicSession } from '@/components/auth/public-session';
import Footer from '@/components/core/footer';
import Header from '@/components/core/header';
import { useUiText } from '@/i18n/ui-text';

const features = [
  {
    icon: MessageCircle,
    title: 'Conversations that flow',
    description: 'Direct messages and group chats, with live updates and delivery receipts.',
  },
  {
    icon: Users,
    title: 'Bring your people together',
    description: 'Find contacts, create groups, and build communities around shared interests.',
  },
  {
    icon: Search,
    title: 'Find the moment',
    description: 'Search messages by person, date, conversation, or attachment type.',
  },
  {
    icon: FileText,
    title: 'Share a little more',
    description: 'Send supported images, videos, audio, and documents right in your chats.',
  },
  {
    icon: Bell,
    title: 'Stay in the loop',
    description: 'Get live message alerts while the app is open, with controls for quieter conversations.',
  },
  {
    icon: ShieldCheck,
    title: 'Your space, your settings',
    description: 'Manage your profile, privacy preferences, devices, and active sessions.',
  },
];

export default function HomePage() {
  const text = useUiText();
  const signedIn = usePublicSession();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f8f6] dark:bg-[#101b20]">
      <Header />
      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-48 size-[600px] rounded-full bg-emerald-300/15 blur-3xl"
          />
          <div className="relative">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              {text('A little more connected')}
            </p>
            <h1 className="max-w-xl text-5xl leading-[1.08] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {text('Good conversations.')} <span className="text-primary">{text('Closer connections.')}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              {text('A calm, thoughtful space for your people, groups, and everyday moments. Welcome to Convo.')}
            </p>
            {signedIn !== null && (
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/20 transition hover:brightness-110"
                  href={signedIn ? '/chat' : '/register'}
                >
                  {text(signedIn ? 'Open conversations' : 'Start your conversation')}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  className="rounded-2xl border bg-background/70 px-6 py-3.5 text-sm font-medium hover:bg-muted"
                  href={signedIn ? '/settings' : '/login'}
                >
                  {text(signedIn ? 'Settings' : 'Sign in')}
                </Link>
              </div>
            )}
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Fingerprint aria-hidden="true" className="size-4 text-primary" />
              {text('Password and email code. One secure sign-in.')}
            </p>
          </div>
          <div
            aria-label={text('Conversation preview')}
            className="relative rounded-[2rem] border border-white/60 bg-background p-3 shadow-[0_35px_90px_-35px_rgba(8,126,100,0.4)] dark:border-white/10"
          >
            <div className="flex items-center gap-3 border-b px-4 py-5">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300 text-amber-950">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{text('The everyday circle')}</p>
                <p className="text-xs text-muted-foreground">{text('A space for your people')}</p>
              </div>
              <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {text('Live')}
              </span>
            </div>
            <div className="flex min-h-80 flex-col gap-4 rounded-b-3xl bg-[#efeae2] px-5 py-7 dark:bg-[#0b141a]">
              <p className="self-center rounded-lg bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                {text('Today')}
              </p>
              <div className="max-w-[85%] self-start rounded-2xl rounded-tl-none bg-white px-4 py-3 text-sm text-[#172a1e] shadow-sm">
                <p className="mb-1 text-xs font-semibold text-[#087e64]">{text('Your friend')}</p>
                {text('Are we still on for coffee this afternoon?')}
              </div>
              <div className="max-w-[85%] self-end rounded-2xl rounded-tr-none bg-[#d9fdd3] px-4 py-3 text-sm text-[#172a1e] shadow-sm">
                {text('Wouldn’t miss it.')}
                <CheckCheck aria-hidden="true" className="mt-1 ml-auto size-4 text-sky-600" />
              </div>
              <div className="flex max-w-[85%] items-center gap-3 self-start rounded-2xl bg-white px-4 py-3 text-sm text-[#172a1e] shadow-sm">
                <FileText aria-hidden="true" className="size-7 text-[#087e64]" />
                <div>
                  <p className="font-medium">{text('Weekend plans')}</p>
                  <p className="text-xs text-gray-500">{text('Shared document')}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <MessageCircle aria-hidden="true" className="size-4" />
              {text('Make room for a hello.')}
            </div>
          </div>
        </section>
        <section aria-label={text('Convo features')} className="mx-auto max-w-7xl px-6 pb-20">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {text('Made for everyday connection')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {text('Everything you need. A little less noise.')}
          </h2>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article className="rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm" key={title}>
                <span className="mb-5 grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-emerald-200/30 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="font-semibold">{text(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text(description)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mx-6 mb-16 rounded-[2rem] bg-gradient-to-br from-[#063f35] to-[#0d9870] px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight">{text('Your next conversation starts here.')}</h2>
          <p className="mt-3 text-sm text-emerald-50/80">
            {text('Available in English, Punjabi, and Hindi. Light or dark. Always your space.')}
          </p>
          {signedIn !== null && (
            <Link
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#087e64]"
              href={signedIn ? '/chat' : '/register'}
            >
              {text(signedIn ? 'Open conversations' : 'Create account')}
            </Link>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
