'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';

export function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const text = useUiText();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const payload = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !payload.success) {
        setError(payload.message ?? text('Could not sign out.'));
        return;
      }
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    } catch {
      setError(text('Could not reach the sign-out service.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Button
        aria-label={iconOnly ? text('Sign out') : undefined}
        className={iconOnly ? 'size-9' : 'w-full justify-start'}
        disabled={isSubmitting}
        onClick={logout}
        size={iconOnly ? 'icon' : 'default'}
        type="button"
        variant="ghost"
      >
        <LogOut aria-hidden="true" />
        {!iconOnly && (isSubmitting ? text('Signing out…') : text('Sign out'))}
      </Button>
      {error && (
        <p aria-live="polite" className="mt-2 text-xs text-destructive" role="alert">
          {text(error)}
        </p>
      )}
    </div>
  );
}
