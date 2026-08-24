import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'pa', 'hi'] as const;

export default getRequestConfig(async () => {
  const storedLocale = (await cookies()).get('locale')?.value;
  const locale = locales.find((locale) => locale === storedLocale) ?? 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
