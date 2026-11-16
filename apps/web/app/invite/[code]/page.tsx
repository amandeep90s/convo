import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { InvitePreview } from '@/components/app/invite-preview';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/server/api';

export default async function InviteCodePage({ params }: { params: Promise<{ code: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.has(ACCESS_TOKEN_COOKIE) && !cookieStore.has(REFRESH_TOKEN_COOKIE)) {
    redirect('/login');
  }
  const { code } = await params;
  return (
    <main className="px-4 py-10">
      <InvitePreview code={code} />
    </main>
  );
}
