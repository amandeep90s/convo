'use client';

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/client/api';

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  about: string | null;
  avatar_url: string | null;
  status: string;
  email_verified_at: string | null;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => apiRequest<CurrentUser>('users/me'),
  });
}
