'use client';

import { resendVerificationSchema, verifyEmailSchema } from '@repo/shared';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { AuthCard, AuthError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function VerifyEmailForm({ initialToken = '' }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = verifyEmailSchema.safeParse({ token });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter the verification token.');
      return;
    }

    await post('/api/auth/verify-email', parsed.data, 'Email verified. You can now sign in.');
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }
    await post(
      '/api/auth/resend-verification',
      parsed.data,
      'If the account exists, a verification email has been sent.',
    );
  }

  async function post(endpoint: string, body: unknown, successMessage: string) {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setError(payload.message ?? 'The request could not be completed.');
        return;
      }
      setMessage(payload.message ?? successMessage);
    } catch {
      setError('Could not reach the authentication service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      description="Verify your email address to activate your account."
      footer={
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Return to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={verify}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="token">Verification token</Label>
          <Input
            autoComplete="one-time-code"
            id="token"
            onChange={(event) => setToken(event.target.value)}
            required
            value={token}
          />
        </div>
        {error && <AuthError>{error}</AuthError>}
        {message && <AuthSuccess>{message}</AuthSuccess>}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>
      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-medium">Need another verification email?</p>
        <form className="flex flex-col gap-3" onSubmit={resend}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="verification-email">Email address</Label>
            <Input
              autoComplete="email"
              id="verification-email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>
          <Button disabled={isSubmitting} type="submit" variant="outline">
            Resend instructions
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
