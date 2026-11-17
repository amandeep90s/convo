'use client';

import type { UserPresence } from '@repo/shared';

import { useUiText } from '@/i18n/ui-text';

export function PresenceStatus({ presence }: { presence: UserPresence }) {
  const text = useUiText();
  if (!presence) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" data-presence={presence}>
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${presence === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`}
      />
      {text(presence === 'online' ? 'Online' : 'Offline')}
    </span>
  );
}
