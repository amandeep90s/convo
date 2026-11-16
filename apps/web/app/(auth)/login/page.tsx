import { LoginForm } from '@/components/auth/login-form';

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <main className="flex min-h-[65vh] w-full items-center justify-center px-4 py-10">
      <LoginForm returnTo={returnTo} />
    </main>
  );
}
