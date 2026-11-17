'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type LoginDto,
  loginSchema,
  type RequestLoginOtpDto,
  requestLoginOtpSchema,
  type VerifyLoginOtpDto,
  verifyLoginOtpSchema,
} from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { AuthCard, AuthError, AuthFieldError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginMode = 'password' | 'otp';
type OtpStep = 'request' | 'verify';

type AuthResponse = {
  success?: boolean;
  message?: string;
};

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('request');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpEmailForm = useForm<z.input<typeof requestLoginOtpSchema>, unknown, RequestLoginOtpDto>({
    resolver: zodResolver(requestLoginOtpSchema),
    defaultValues: { email: '' },
  });
  const otpCodeForm = useForm<z.input<typeof verifyLoginOtpSchema>, unknown, VerifyLoginOtpDto>({
    resolver: zodResolver(verifyLoginOtpSchema),
    defaultValues: { email: '', code: '' },
  });
  const passwordForm = useForm<z.input<typeof loginSchema>, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const destination = safeReturnTo(returnTo);

  async function handlePasswordForm(data: LoginDto) {
    await submitAuth('/api/auth/login', data, 'Sign in failed');
  }

  async function requestCode(data: RequestLoginOtpDto) {
    const succeeded = await submitAuth('/api/auth/login/otp/request', data, 'Could not request a login code');
    if (succeeded) {
      setEmail(data.email);
      otpCodeForm.reset({ email: data.email, code: '' });
      setOtpStep('verify');
      setNotice('If the account is eligible, a login code has been sent to that email address.');
    }
  }

  async function verifyCode(data: VerifyLoginOtpDto) {
    await submitAuth('/api/auth/login/otp/verify', data, 'Could not verify the login code', true);
  }

  async function submitAuth(
    endpoint: string,
    body: LoginDto | RequestLoginOtpDto | VerifyLoginOtpDto,
    fallbackMessage: string,
    establishesSession = false,
  ): Promise<boolean> {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as AuthResponse;
      if (!response.ok || !payload.success) {
        setError(payload.message ?? fallbackMessage);
        return false;
      }
      if (establishesSession || endpoint === '/api/auth/login') {
        router.replace(destination);
        router.refresh();
      } else {
        setNotice(payload.message ?? 'Request completed.');
      }
      return true;
    } catch {
      setError('Could not reach the authentication service. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to pick up your conversations."
      footer={
        <p>
          New to Convo?{' '}
          <Link className="font-medium text-foreground underline underline-offset-4" href="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <div aria-label="Sign-in method" className="grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist">
        <button
          aria-selected={mode === 'password'}
          className={`rounded-md px-3 py-2 text-sm font-medium ${mode === 'password' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => {
            setMode('password');
            setError(null);
            setNotice(null);
          }}
          role="tab"
          type="button"
        >
          Password
        </button>
        <button
          aria-selected={mode === 'otp'}
          className={`rounded-md px-3 py-2 text-sm font-medium ${mode === 'otp' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => {
            setMode('otp');
            setError(null);
            setNotice(null);
          }}
          role="tab"
          type="button"
        >
          Email code
        </button>
      </div>

      {mode === 'password' ? (
        <form className="flex flex-col gap-4" onSubmit={passwordForm.handleSubmit(handlePasswordForm)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier">Email or username</Label>
            <Input
              autoComplete="username"
              id="identifier"
              aria-describedby={passwordForm.formState.errors.identifier ? 'identifier-error' : undefined}
              aria-invalid={Boolean(passwordForm.formState.errors.identifier)}
              className="h-11 rounded-xl bg-background/70 px-3"
              {...passwordForm.register('identifier')}
            />
            <AuthFieldError id="identifier" message={passwordForm.formState.errors.identifier?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link className="text-xs text-muted-foreground underline underline-offset-4" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Input
              autoComplete="current-password"
              id="password"
              aria-describedby={passwordForm.formState.errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(passwordForm.formState.errors.password)}
              className="h-11 rounded-xl bg-background/70 px-3"
              type="password"
              {...passwordForm.register('password')}
            />
            <AuthFieldError id="password" message={passwordForm.formState.errors.password?.message} />
          </div>
          {error && <AuthError>{error}</AuthError>}
          {notice && <AuthSuccess>{notice}</AuthSuccess>}
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={
            otpStep === 'request' ? otpEmailForm.handleSubmit(requestCode) : otpCodeForm.handleSubmit(verifyCode)
          }
        >
          {otpStep === 'request' ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp-email">Email address</Label>
              <Input
                autoComplete="email"
                id="otp-email"
                aria-describedby={otpEmailForm.formState.errors.email ? 'otp-email-error' : undefined}
                aria-invalid={Boolean(otpEmailForm.formState.errors.email)}
                className="h-11 rounded-xl bg-background/70 px-3"
                type="email"
                {...otpEmailForm.register('email')}
              />
              <AuthFieldError id="otp-email" message={otpEmailForm.formState.errors.email?.message} />
            </div>
          ) : (
            <>
              <input type="hidden" {...otpCodeForm.register('email')} />
              <p className="text-sm text-muted-foreground">
                Enter the six-digit code sent to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="otp-code">Login code</Label>
                <Input
                  autoComplete="one-time-code"
                  id="otp-code"
                  aria-describedby={otpCodeForm.formState.errors.code ? 'otp-code-error' : undefined}
                  aria-invalid={Boolean(otpCodeForm.formState.errors.code)}
                  className="h-12 rounded-xl bg-background/70 px-3 text-center text-lg tracking-[0.45em]"
                  inputMode="numeric"
                  maxLength={6}
                  {...otpCodeForm.register('code')}
                />
                <AuthFieldError id="otp-code" message={otpCodeForm.formState.errors.code?.message} />
              </div>
            </>
          )}
          {error && <AuthError>{error}</AuthError>}
          {notice && <AuthSuccess>{notice}</AuthSuccess>}
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Please wait…' : otpStep === 'request' ? 'Send login code' : 'Verify and sign in'}
          </Button>
          {otpStep === 'verify' && (
            <Button
              className="w-full"
              onClick={() => {
                setOtpStep('request');
                setError(null);
                setNotice(null);
              }}
              type="button"
              variant="ghost"
            >
              Use a different email
            </Button>
          )}
        </form>
      )}
    </AuthCard>
  );
}

function safeReturnTo(value?: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/chat';
  return value;
}
