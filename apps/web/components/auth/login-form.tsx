'use client';

import { loginSchema, requestLoginOtpSchema, verifyLoginOtpSchema } from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { AuthCard, AuthError, AuthSuccess } from '@/components/auth/auth-card';
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

  const destination = safeReturnTo(returnTo);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      identifier: formData.get('identifier'),
      password: formData.get('password'),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter your sign-in details.');
      return;
    }

    await submitAuth('/api/auth/login', parsed.data, 'Sign in failed');
  }

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = requestLoginOtpSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }

    const succeeded = await submitAuth('/api/auth/login/otp/request', parsed.data, 'Could not request a login code');
    if (succeeded) {
      setOtpStep('verify');
      setNotice('If the account is eligible, a login code has been sent to that email address.');
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = verifyLoginOtpSchema.safeParse({
      email,
      code: formData.get('code'),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter the six-digit code.');
      return;
    }
    await submitAuth('/api/auth/login/otp/verify', parsed.data, 'Could not verify the login code', true);
  }

  async function submitAuth(
    endpoint: string,
    body: unknown,
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
        <form className="flex flex-col gap-4" onSubmit={submitPassword}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier">Email or username</Label>
            <Input autoComplete="username" id="identifier" name="identifier" required />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link className="text-xs text-muted-foreground underline underline-offset-4" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Input autoComplete="current-password" id="password" name="password" required type="password" />
          </div>
          {error && <AuthError>{error}</AuthError>}
          {notice && <AuthSuccess>{notice}</AuthSuccess>}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={otpStep === 'request' ? requestCode : verifyCode}>
          {otpStep === 'request' ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp-email">Email address</Label>
              <Input
                autoComplete="email"
                id="otp-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the six-digit code sent to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="otp-code">Login code</Label>
                <Input
                  autoComplete="one-time-code"
                  autoFocus
                  id="otp-code"
                  inputMode="numeric"
                  maxLength={6}
                  name="code"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
            </>
          )}
          {error && <AuthError>{error}</AuthError>}
          {notice && <AuthSuccess>{notice}</AuthSuccess>}
          <Button disabled={isSubmitting} type="submit">
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
