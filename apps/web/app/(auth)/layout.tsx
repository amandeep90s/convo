import { cookies } from 'next/headers';

import { PublicSession } from '@/components/auth/public-session';
import Footer from '@/components/core/footer';
import Header from '@/components/core/header';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/server/api';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  );
  return (
    <PublicSession hasSessionCookie={hasSessionCookie} guestOnly>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f8f6] dark:bg-[#101b18]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(54,184,137,0.13),transparent_42%),radial-gradient(ellipse_at_90%_90%,rgba(19,126,100,0.10),transparent_38%)]"
        />
        <Header />
        <main className="relative flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
        <Footer />
      </div>
    </PublicSession>
  );
}
