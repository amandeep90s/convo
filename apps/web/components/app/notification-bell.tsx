'use client';

import type { RealtimeMessage } from '@repo/shared';
import { Bell } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUiText } from '@/i18n/ui-text';

export type NotificationItem = { message: RealtimeMessage; read: boolean };

export function NotificationBell({
  items,
  onRead,
  onReadAll,
}: {
  items: NotificationItem[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const text = useUiText();
  const unread = items.filter((item) => !item.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Notifications" className="relative rounded-xl" size="icon" variant="outline">
            <Bell aria-hidden="true" className="size-4" />
            {unread > 0 && (
              <span
                aria-label="Unread notifications"
                className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              >
                {unread > 49 ? '49+' : unread}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-2">
        <div className="flex items-center justify-between gap-3 border-b p-2">
          <p className="font-semibold">{text('Notifications')}</p>
          {unread > 0 && (
            <Button onClick={onReadAll} size="sm" variant="ghost">
              {text('Mark all as read')}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{text('No new notifications.')}</p>
          )}
          {items.map(({ message, read }) => (
            <Link
              className={`mt-1 block rounded-xl p-3 text-sm hover:bg-muted ${read ? '' : 'bg-primary/5'}`}
              href={`/chat/${message.conversation_id}`}
              key={message.id}
              onClick={() => onRead(message.id)}
            >
              <span className="block font-medium">{message.sender.name}</span>
              <span className="line-clamp-2 text-muted-foreground">
                {message.content || text('Shared an attachment')}
              </span>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
