'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
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
        setError(payload.message ?? 'Could not sign out.');
        return;
      }
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Could not reach the sign-out service.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Button
        aria-label={iconOnly ? 'Sign out' : undefined}
        className={iconOnly ? 'size-9' : 'w-full justify-start'}
        disabled={isSubmitting}
        onClick={logout}
        size={iconOnly ? 'icon' : 'default'}
        type="button"
        variant="ghost"
      >
        <LogOut aria-hidden="true" />
        {!iconOnly && (isSubmitting ? 'Signing out…' : 'Sign out')}
      </Button>
      {error && (
        <p aria-live="polite" className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
