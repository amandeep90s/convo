'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type LoginChallenge,
  loginChallengeSchema,
  type LoginDto,
  loginSchema,
  type VerifyLoginOtpDto,
  verifyLoginOtpSchema,
} from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthCard, AuthError, AuthFieldError } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUiText } from '@/i18n/ui-text';

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const text = useUiText();
  const router = useRouter();
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const credentials = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });
  const verification = useForm<VerifyLoginOtpDto>({
    resolver: zodResolver(verifyLoginOtpSchema),
    defaultValues: { challengeToken: '', code: '' },
  });

  async function submit(body: LoginDto | VerifyLoginOtpDto) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(challenge ? '/api/auth/login/otp/verify' : '/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object' || !('success' in payload)) {
        setError(text('Invalid response from the authentication service.'));
        return;
      }
      if (!response.ok || payload.success !== true) {
        setError(
          'message' in payload && typeof payload.message === 'string' ? payload.message : text('Sign in failed'),
        );
        return;
      }
      if (!challenge) {
        const result = loginChallengeSchema.safeParse('data' in payload ? payload.data : undefined);
        if (!result.success) {
          setError(text('Invalid response from the authentication service.'));
          return;
        }
        const nextChallenge = result.data;
        verification.reset({ challengeToken: nextChallenge.challengeToken, code: '' });
        credentials.resetField('password');
        setChallenge(nextChallenge);
      } else {
        router.replace(safeReturnTo(returnTo));
        router.refresh();
      }
    } catch {
      setError(text('Could not reach the authentication service. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={text('Welcome back')}
      description={text('Enter your credentials, then confirm the code sent to your email.')}
      footer={
        <p>
          {text('New to Convo?')}{' '}
          <Link className="font-medium underline underline-offset-4" href="/register">
            {text('Create an account')}
          </Link>
        </p>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={challenge ? verification.handleSubmit(submit) : credentials.handleSubmit(submit)}
      >
        {!challenge ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifier">{text('Email or username')}</Label>
              <Input
                id="identifier"
                autoComplete="username"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(credentials.formState.errors.identifier)}
                aria-describedby={credentials.formState.errors.identifier ? 'identifier-error' : undefined}
                {...credentials.register('identifier')}
              />
              <AuthFieldError id="identifier" message={credentials.formState.errors.identifier?.message} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{text('Password')}</Label>
                <Link className="text-xs text-muted-foreground underline" href="/forgot-password">
                  {text('Forgot password?')}
                </Link>
              </div>
              <Input
                id="password"
                autoComplete="current-password"
                type="password"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(credentials.formState.errors.password)}
                aria-describedby={credentials.formState.errors.password ? 'password-error' : undefined}
                {...credentials.register('password')}
              />
              <AuthFieldError id="password" message={credentials.formState.errors.password?.message} />
            </div>
          </>
        ) : (
          <>
            <input type="hidden" {...verification.register('challengeToken')} />
            <p className="text-sm text-muted-foreground">
              {text('Enter the six-digit code sent to')} <strong>{challenge.email}</strong>.
            </p>
            <Label htmlFor="login-code">{text('Login code')}</Label>
            <Input
              id="login-code"
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              className="h-12 rounded-xl text-center text-lg tracking-[0.45em]"
              aria-invalid={Boolean(verification.formState.errors.code)}
              aria-describedby={verification.formState.errors.code ? 'login-code-error' : undefined}
              {...verification.register('code')}
            />
            <AuthFieldError id="login-code" message={verification.formState.errors.code?.message} />
          </>
        )}
        {error && <AuthError>{text(error)}</AuthError>}
        <Button
          className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold text-white"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? text('Please wait…') : challenge ? text('Verify and sign in') : text('Send login code')}
        </Button>
        {challenge && (
          <Button
            disabled={isSubmitting}
            onClick={() => {
              setChallenge(null);
              setError(null);
              verification.reset();
            }}
            type="button"
            variant="ghost"
          >
            {text('Back to credentials')}
          </Button>
        )}
      </form>
    </AuthCard>
  );
}

function safeReturnTo(value?: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/chat';
  return value;
}
