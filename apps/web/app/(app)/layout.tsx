import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/app/app-shell';
import { NotificationSoundProvider } from '@/components/app/notification-sound';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/server/api';

export default async function ProtectedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const hasAccessToken = cookieStore.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = cookieStore.has(REFRESH_TOKEN_COOKIE);

  if (!hasAccessToken && !hasRefreshToken) {
    redirect('/login');
  }

  return (
    <NotificationSoundProvider>
      <AppShell>{children}</AppShell>
    </NotificationSoundProvider>
  );
}
