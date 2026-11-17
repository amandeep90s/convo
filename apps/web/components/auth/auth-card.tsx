import { LockKeyhole, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  const text = useUiText();
  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_32px_100px_-44px_rgba(13,74,57,0.42)] backdrop-blur-xl md:min-h-[620px] md:grid-cols-[0.95fr_1.05fr] dark:border-white/10 dark:bg-card/90">
      <section
        aria-label="Convo"
        className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#063f35] via-[#087e64] to-[#25a87e] p-10 text-white md:flex lg:p-12"
      >
        <div aria-hidden="true" className="absolute -top-20 -right-24 size-80 rounded-full border border-white/10" />
        <div
          aria-hidden="true"
          className="absolute -bottom-36 -left-20 size-96 rounded-full bg-[#61d7a8]/15 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <MessageCircle aria-hidden="true" className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Convo</span>
        </div>

        <div className="relative my-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
            <Sparkles aria-hidden="true" className="size-3.5" />
            {text('A little more connected')}
          </div>
          <h2 className="max-w-sm text-4xl leading-[1.12] font-semibold tracking-tight lg:text-[2.75rem]">
            {text('Make room for the conversations that matter.')}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/80">
            {text('Your people, your groups, and all the little moments in one thoughtful space.')}
          </p>

          <div className="mt-10 max-w-sm rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl shadow-[#003a31]/20 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3 border-b border-white/15 pb-3">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-xs font-semibold text-amber-950">
                J
              </span>
              <div>
                <p className="text-sm font-medium">Jamie Parker</p>
                <p className="text-xs text-emerald-50/70">{text('online now')}</p>
              </div>
              <span className="ml-auto size-2 rounded-full bg-[#8bf0bb] ring-4 ring-[#8bf0bb]/15" />
            </div>
            <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-white/15 px-3.5 py-2.5 text-sm text-white/95">
              {text('Are we still on for coffee this afternoon?')}
            </p>
            <p className="mt-2 ml-auto w-fit rounded-2xl rounded-tr-sm bg-[#b7f4d2] px-3.5 py-2.5 text-sm text-[#104b3d]">
              {text('Wouldn’t miss it ☕')}
            </p>
            <p className="mt-2 text-right text-[11px] text-emerald-50/70">{text('Read · 10:42')}</p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-emerald-50/80">
          <ShieldCheck aria-hidden="true" className="size-4" />
          {text('A private space for your everyday conversations')}
        </div>
      </section>

      <Card className="flex w-full flex-col justify-center border-0 bg-transparent py-8 shadow-none sm:py-12">
        <CardHeader className="gap-2 px-6 pb-5 sm:px-10 lg:px-12">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-primary uppercase md:hidden">
            <MessageCircle aria-hidden="true" className="size-4" />
            Convo
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight">{text(title)}</CardTitle>
          <CardDescription className="max-w-sm text-sm leading-6">{text(description)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-6 sm:px-10 lg:px-12">
          {children}
          {footer && (
            <div className="border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">{footer}</div>
          )}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <LockKeyhole aria-hidden="true" className="size-3" />
            {text('Your account details stay private')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
      role="alert"
    >
      {children}
    </p>
  );
}

export function AuthSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="rounded-md border border-primary/25 bg-primary/5 p-3 text-sm" role="status">
      {children}
    </p>
  );
}

export function AuthFieldError({ id, message }: { id: string; message?: string }) {
  const text = useUiText();
  if (!message) return null;

  return (
    <p className="text-xs font-medium text-destructive" id={`${id}-error`}>
      {text(message)}
    </p>
  );
}
