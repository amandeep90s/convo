import { ThemeToggle } from "@/components/core/theme-toggle";

export default function Home() {
  return (
    <div className='min-h-screen flex-col gap-4 flex items-center justify-center'>
      <h1 className='text-3xl font-bold'>Convo App</h1>
      <ThemeToggle />
    </div>
  );
}
