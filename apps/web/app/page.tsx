import { ThemeToggle } from '@/components/core/theme-toggle';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Convo App</h1>
      <ThemeToggle />
    </div>
  );
}
