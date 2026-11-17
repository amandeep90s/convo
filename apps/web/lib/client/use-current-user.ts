'use client';

import type { TUser } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/client/api';

export type CurrentUser = Pick<TUser, 'id' | 'email' | 'username' | 'name' | 'about' | 'avatar_url' | 'status'> & {
  email_verified_at: string | null;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => apiRequest<CurrentUser>('users/me'),
  });
}
