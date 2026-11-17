'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ResetPasswordDto, resetPasswordSchema } from '@repo/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthCard, AuthError, AuthFieldError, AuthSuccess } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirm password is required') })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.input<typeof resetPasswordFormSchema>, unknown, z.output<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  async function submit(data: z.output<typeof resetPasswordFormSchema>) {
    setError(null);
    const body: ResetPasswordDto = { token: data.token, password: data.password };
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
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
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
            onClick={() => router.replace('/login')}
            type="button"
          >
            Sign in with your new password
          </Button>
        </div>
      ) : token ? (
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
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
          {error && <AuthError>{error}</AuthError>}
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      ) : (
        <AuthError>This password reset link is missing its token. Request a new link to continue.</AuthError>
      )}
    </AuthCard>
  );
}
