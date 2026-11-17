'use client';

import type { UserPresence } from '@repo/shared';

import { AvatarBadge } from '@/components/ui/avatar';
import { useUiText } from '@/i18n/ui-text';

export function PresenceStatus({ presence }: { presence: UserPresence }) {
  const text = useUiText();
  if (!presence) return null;
  return (
    <AvatarBadge
      role="img"
      aria-label={text(presence === 'online' ? 'Online' : 'Offline')}
      title={text(presence === 'online' ? 'Online' : 'Offline')}
      className={presence === 'online' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}
      data-presence={presence}
    />
  );
}
