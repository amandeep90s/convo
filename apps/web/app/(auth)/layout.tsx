import Footer from '@/components/core/footer';
import Header from '@/components/core/header';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
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
  );
}
