'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ResendVerificationDto,
  resendVerificationSchema,
  type VerifyEmailDto,
  verifyEmailSchema,
} from '@repo/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { AuthCard, AuthError, AuthFieldError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUiText } from '@/i18n/ui-text';

export function VerifyEmailForm({ initialToken = '' }: { initialToken?: string }) {
  const text = useUiText();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verifyForm = useForm<z.input<typeof verifyEmailSchema>, unknown, VerifyEmailDto>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: initialToken },
  });
  const resendForm = useForm<z.input<typeof resendVerificationSchema>, unknown, ResendVerificationDto>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: '' },
  });

  async function verify(data: VerifyEmailDto) {
    await post('/api/auth/verify-email', data, text('Email verified. You can now sign in.'));
  }

  async function resend(data: ResendVerificationDto) {
    await post(
      '/api/auth/resend-verification',
      data,
      text('If the account exists, a verification email has been sent.'),
    );
  }

  async function post(endpoint: string, body: VerifyEmailDto | ResendVerificationDto, successMessage: string) {
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
        setError(payload.message ?? text('The request could not be completed.'));
        return;
      }
      setMessage(payload.message ?? successMessage);
    } catch {
      setError(text('Could not reach the authentication service. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={text('Verify your email')}
      description={text('Verify your email address to activate your account.')}
      footer={
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Return to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={verifyForm.handleSubmit(verify)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="token">{text('Verification token')}</Label>
          <Input
            autoComplete="one-time-code"
            id="token"
            aria-describedby={verifyForm.formState.errors.token ? 'token-error' : undefined}
            aria-invalid={Boolean(verifyForm.formState.errors.token)}
            className="h-11 rounded-xl bg-background/70 px-3"
            {...verifyForm.register('token')}
          />
          <AuthFieldError id="token" message={verifyForm.formState.errors.token?.message} />
        </div>
        {error && <AuthError>{text(error)}</AuthError>}
        {message && <AuthSuccess>{message}</AuthSuccess>}
        <Button
          className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? text('Verifying…') : text('Verify email')}
        </Button>
      </form>
      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-medium">{text('Need another verification email?')}</p>
        <form className="flex flex-col gap-3" onSubmit={resendForm.handleSubmit(resend)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="verification-email">{text('Email address')}</Label>
            <Input
              autoComplete="email"
              id="verification-email"
              aria-describedby={resendForm.formState.errors.email ? 'verification-email-error' : undefined}
              aria-invalid={Boolean(resendForm.formState.errors.email)}
              className="h-11 rounded-xl bg-background/70 px-3"
              type="email"
              {...resendForm.register('email')}
            />
            <AuthFieldError id="verification-email" message={resendForm.formState.errors.email?.message} />
          </div>
          <Button className="h-10 rounded-xl" disabled={isSubmitting} type="submit" variant="outline">
            {text('Resend instructions')}
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
