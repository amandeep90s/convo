import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-border/70 shadow-xl shadow-foreground/5">
      <CardHeader className="gap-2">
        <Link className="w-fit text-sm font-semibold tracking-[0.2em] text-primary uppercase" href="/">
          Convo
        </Link>
        <CardTitle className="pt-2 text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {children}
        {footer && <div className="border-t pt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
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
