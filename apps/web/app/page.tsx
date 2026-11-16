import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LanguageToggle } from '@/components/core/language-toggle';
import { ThemeToggle } from '@/components/core/theme-toggle';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <Link className="text-sm font-medium underline underline-offset-4" href="/search">
        Search messages
      </Link>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
