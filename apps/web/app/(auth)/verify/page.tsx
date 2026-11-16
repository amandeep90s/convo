import { VerifyEmailForm } from '@/components/auth/verify-email-form';

type VerifyPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="flex min-h-[65vh] w-full items-center justify-center px-4 py-10">
      <VerifyEmailForm initialToken={token} />
    </main>
  );
}
