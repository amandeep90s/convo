'use client';

import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiText } from '@/i18n/ui-text';

const locales = [
  { code: 'en', label: 'English' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'hi', label: 'हिन्दी' },
] as const;

export function LanguageToggle() {
  const text = useUiText();
  const locale = useLocale();
  const router = useRouter();

  function setLocale(nextLocale: (typeof locales)[number]['code']) {
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="rounded-xl">
            <Languages className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{text('Change language')}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {locales.map(({ code, label }) => (
          <DropdownMenuItem key={code} disabled={locale === code} onClick={() => setLocale(code)}>
            {text(label)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
