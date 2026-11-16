'use client';

import { registerSchema } from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { AuthCard, AuthError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: data.get('name'),
      username: data.get('username'),
      email: data.get('email'),
      password: data.get('password'),
      confirmPassword: data.get('confirmPassword'),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the account details.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setError(payload.message ?? 'Could not create your account.');
        return;
      }
      setComplete(true);
    } catch {
      setError('Could not reach the registration service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Join your conversations with a verified email address."
      footer={
        <p>
          Already have an account?{' '}
          <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
            Sign in
          </Link>
        </p>
      }
    >
      {complete ? (
        <div className="flex flex-col gap-4">
          <AuthSuccess>Account created. Check your email for a verification link before signing in.</AuthSuccess>
          <Button onClick={() => router.replace('/login')} type="button">
            Continue to sign in
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input autoComplete="name" id="name" maxLength={100} name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input autoComplete="username" id="username" maxLength={50} minLength={2} name="username" required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input autoComplete="email" id="email" name="email" required type="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input autoComplete="new-password" id="password" minLength={8} name="password" required type="password" />
            <p className="text-xs text-muted-foreground">
              Use at least 8 characters with upper- and lowercase letters, a number, and a symbol.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input autoComplete="new-password" id="confirmPassword" name="confirmPassword" required type="password" />
          </div>
          {error && <AuthError>{error}</AuthError>}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
