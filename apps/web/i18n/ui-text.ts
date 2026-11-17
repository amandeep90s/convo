import { useTranslations } from 'next-intl';

import { messageKey } from '@/i18n/message-key';

type UiText = (message: string, values?: Record<string, string | number>) => string;
const translators = new WeakMap<object, UiText>();

export function useUiText(): UiText {
  const translate = useTranslations('UI');
  const cached = translators.get(translate);
  if (cached) return cached;
  const text: UiText = (message, values) => {
    const key = messageKey(message);
    if (translate.has(key)) return translate(key, values);
    // Unknown server errors retain their diagnostic detail instead of becoming a generic success/fallback.
    return message;
  };
  translators.set(translate, text);
  return text;
}
