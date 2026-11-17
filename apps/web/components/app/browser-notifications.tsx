'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';

export function BrowserNotifications() {
  const text = useUiText();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
  }, []);

  async function enable() {
    try {
      setError(null);
      setPermission(await Notification.requestPermission());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('Could not enable browser notifications.'));
    }
  }

  return (
    <div className="rounded-2xl border border-border/70 p-4 text-sm">
      <p className="font-medium">{text('Browser notifications')}</p>
      <p className="mt-1 text-muted-foreground">
        {text(
          'In-app message alerts work while Convo is open. Browser alerts also require permission and appear when the tab is hidden. Alerts after the browser is closed are not supported.',
        )}
      </p>
      {permission === 'default' && (
        <Button className="mt-3" onClick={() => void enable()} type="button" variant="outline">
          {text('Enable browser notifications')}
        </Button>
      )}
      {permission === 'granted' && <p className="mt-2 text-primary">{text('Browser permission enabled.')}</p>}
      {permission === 'denied' && (
        <p className="mt-2">{text('Notifications are blocked. Allow them in your browser site settings.')}</p>
      )}
      {permission === 'unsupported' && (
        <p className="mt-2">
          {text('This browser does not support desktop notifications. In-app alerts remain available.')}
        </p>
      )}
      {error && (
        <p className="mt-2 text-destructive" role="alert">
          {text(error)}
        </p>
      )}
    </div>
  );
}
