'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterDto, registerSchema } from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { AuthCard, AuthError, AuthFieldError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUiText } from '@/i18n/ui-text';

export function RegisterForm() {
  const text = useUiText();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.input<typeof registerSchema>, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: '', password: '', confirmPassword: '' },
  });

  async function submit(data: RegisterDto) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setError(payload.message ?? text('Could not create your account.'));
        return;
      }
      setComplete(true);
    } catch {
      setError(text('Could not reach the registration service. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={text('Create your account')}
      description={text('Join your conversations with a verified email address.')}
      footer={
        <p>
          {text('Already have an account?')}{' '}
          <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
            {text('Sign in')}
          </Link>
        </p>
      }
    >
      {complete ? (
        <div className="flex flex-col gap-4">
          <AuthSuccess>
            {text('Account created. Check your email for a verification link before signing in.')}
          </AuthSuccess>
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
            onClick={() => router.replace('/login')}
            type="button"
          >
            {text('Continue to sign in')}
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{text('Name')}</Label>
              <Input
                autoComplete="name"
                id="name"
                aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
                aria-invalid={Boolean(form.formState.errors.name)}
                className="h-11 rounded-xl bg-background/70 px-3"
                maxLength={100}
                {...form.register('name')}
              />
              <AuthFieldError id="name" message={form.formState.errors.name?.message} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{text('Username')}</Label>
              <Input
                autoComplete="username"
                id="username"
                aria-describedby={form.formState.errors.username ? 'username-error' : undefined}
                aria-invalid={Boolean(form.formState.errors.username)}
                className="h-11 rounded-xl bg-background/70 px-3"
                maxLength={50}
                {...form.register('username')}
              />
              <AuthFieldError id="username" message={form.formState.errors.username?.message} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{text('Email address')}</Label>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{text('Password')}</Label>
            <Input
              autoComplete="new-password"
              id="password"
              aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(form.formState.errors.password)}
              className="h-11 rounded-xl bg-background/70 px-3"
              type="password"
              {...form.register('password')}
            />
            <AuthFieldError id="password" message={form.formState.errors.password?.message} />
            <p className="text-xs text-muted-foreground">
              {text('Use at least 8 characters with upper- and lowercase letters, a number, and a symbol.')}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">{text('Confirm password')}</Label>
            <Input
              autoComplete="new-password"
              id="confirmPassword"
              aria-describedby={form.formState.errors.confirmPassword ? 'confirmPassword-error' : undefined}
              aria-invalid={Boolean(form.formState.errors.confirmPassword)}
              className="h-11 rounded-xl bg-background/70 px-3"
              type="password"
              {...form.register('confirmPassword')}
            />
            <AuthFieldError id="confirmPassword" message={form.formState.errors.confirmPassword?.message} />
          </div>
          {error && <AuthError>{text(error)}</AuthError>}
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? text('Creating account…') : text('Create account')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
