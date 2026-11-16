'use client';

import { resetPasswordSchema } from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { AuthCard, AuthError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid new password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setError(payload.message ?? 'Could not reset your password.');
        return;
      }
      setComplete(true);
    } catch {
      setError('Could not reach the authentication service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Use a strong password you have not used before."
      footer={
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Return to sign in
        </Link>
      }
    >
      {complete ? (
        <div className="flex flex-col gap-4">
          <AuthSuccess>Password updated. Your other sessions have been signed out.</AuthSuccess>
          <Button onClick={() => router.replace('/login')} type="button">
            Sign in with your new password
          </Button>
        </div>
      ) : token ? (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <Input autoComplete="new-password" id="password" minLength={8} name="password" required type="password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input autoComplete="new-password" id="confirmPassword" name="confirmPassword" required type="password" />
          </div>
          {error && <AuthError>{error}</AuthError>}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      ) : (
        <AuthError>This password reset link is missing its token. Request a new link to continue.</AuthError>
      )}
    </AuthCard>
  );
}
