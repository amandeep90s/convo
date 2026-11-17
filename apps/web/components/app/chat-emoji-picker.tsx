'use client';

import EmojiPicker, { Categories, type EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';

import { useUiText } from '@/i18n/ui-text';

const hindiEmojis = () => import('emoji-picker-react/data/emojis-hi');

export default function ChatEmojiPicker({ onEmojiClick }: { onEmojiClick: (emoji: EmojiClickData) => void }) {
  const text = useUiText();
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  return (
    <EmojiPicker
      onEmojiClick={onEmojiClick}
      emojiStyle={EmojiStyle.NATIVE}
      emojiData={locale === 'hi' ? hindiEmojis : undefined}
      colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      width="100%"
      height={350}
      previewConfig={{ showPreview: false }}
      skinTonesDisabled
      variationsDisabled
      labels={{
        searchPlaceholder: text('Search emojis'),
        searchLabel: text('Search emojis'),
        searchClear: text('Clear search'),
        searchResultsNone: text('No emojis found'),
        searchResultsOne: text('1 emoji found. Use arrow keys to navigate.'),
        searchResultsMany: text('%n emojis found. Use arrow keys to navigate.'),
        categoryNavigation: text('Emoji categories'),
        loading: text('Loading…'),
        loadingError: text('Could not load emojis.'),
        retryLoading: text('Try again'),
      }}
      categories={[
        { category: Categories.SUGGESTED, name: text('Recently used') },
        { category: Categories.SMILEYS_PEOPLE, name: text('Smileys and people') },
        { category: Categories.ANIMALS_NATURE, name: text('Animals and nature') },
        { category: Categories.FOOD_DRINK, name: text('Food and drink') },
        { category: Categories.TRAVEL_PLACES, name: text('Travel and places') },
        { category: Categories.ACTIVITIES, name: text('Activities') },
        { category: Categories.OBJECTS, name: text('Objects') },
        { category: Categories.SYMBOLS, name: text('Symbols') },
        { category: Categories.FLAGS, name: text('Flags') },
      ]}
      suggestedEmojisMode="recent"
    />
  );
}
