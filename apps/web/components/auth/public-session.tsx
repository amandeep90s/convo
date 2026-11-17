'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';
import type { CurrentUser } from '@/lib/client/use-current-user';

const SignedInContext = createContext<boolean | null>(null);

export function usePublicSession() {
  return useContext(SignedInContext);
}

export function PublicSession({
  hasSessionCookie,
  guestOnly = false,
  children,
}: {
  hasSessionCookie: boolean;
  guestOnly?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const text = useUiText();
  const session = useQuery({
    queryKey: ['public-session'],
    enabled: hasSessionCookie,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      try {
        return await apiRequest<CurrentUser>('users/me', { redirectOnUnauthorized: false });
      } catch (reason) {
        if (reason instanceof ApiError && reason.status === 401) return null;
        throw reason;
      }
    },
  });
  const signedIn = !hasSessionCookie ? false : session.isPending || session.isFetching ? null : Boolean(session.data);

  useEffect(() => {
    if (guestOnly && signedIn) {
      router.replace('/chat');
      router.refresh();
    }
  }, [guestOnly, signedIn, router]);

  if (hasSessionCookie && session.isError) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-6" role="alert">
        <p>
          {text('Could not load your profile.')} {text(session.error.message)}
        </p>
        <Button onClick={() => void session.refetch()}>{text('Try again')}</Button>
      </div>
    );
  }
  if (guestOnly && signedIn !== false) {
    return (
      <p className="p-6 text-center" role="status">
        {text('Loading account…')}
      </p>
    );
  }

  return <SignedInContext.Provider value={signedIn}>{children}</SignedInContext.Provider>;
}
