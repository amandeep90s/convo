import Footer from '@/components/core/footer';
import Header from '@/components/core/header';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Header />

      <main className="grow">{children}</main>

      <Footer />
    </div>
  );
}
