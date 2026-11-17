import { cookies } from 'next/headers';

import { PublicSession } from '@/components/auth/public-session';
import HomePage from '@/components/core/home-page';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/server/api';

export default async function Page() {
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  );

  return (
    <PublicSession hasSessionCookie={hasSessionCookie}>
      <HomePage />
    </PublicSession>
  );
}
