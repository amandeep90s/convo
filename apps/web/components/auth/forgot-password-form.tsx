'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ForgotPasswordDto, forgotPasswordSchema } from '@repo/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { AuthCard, AuthError, AuthFieldError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.input<typeof forgotPasswordSchema>, unknown, ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function submit(data: ForgotPasswordDto) {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setError(payload.message ?? 'Could not request password reset.');
        return;
      }
      setMessage(payload.message ?? 'If the account exists, password reset instructions have been sent.');
    } catch {
      setError('Could not reach the authentication service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description="We’ll send reset instructions if an account matches that email address."
      footer={
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Return to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            autoComplete="email"
            id="email"
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            aria-invalid={Boolean(form.formState.errors.email)}
            className="h-11 rounded-xl bg-background/70 px-3"
            type="email"
            {...form.register('email')}
          />
          <AuthFieldError id="email" message={form.formState.errors.email?.message} />
        </div>
        {error && <AuthError>{error}</AuthError>}
        {message && <AuthSuccess>{message}</AuthSuccess>}
        <Button
          className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  );
}
