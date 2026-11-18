'use client';

import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';

export function MessageAudio({ attachmentId }: { attachmentId: string }) {
  const text = useUiText();
  const url = `/api/backend/message-attachments/${attachmentId}/file`;
  const request = useRef<AbortController | null>(null);
  const audioUrl = useRef<string | null>(null);
  const [source, setSource] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(
    () => () => {
      request.current?.abort();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    },
    [],
  );

  async function loadAudio() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setFailed(false);
    setLoading(true);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) {
        setFailed(true);
        return;
      }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const objectUrl = URL.createObjectURL(blob);
      audioUrl.current = objectUrl;
      setSource(objectUrl);
    } catch (error) {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      request.current = null;
    }
  }

  return (
    <div className="space-y-1">
      {source ? (
        <audio
          aria-label={text('Audio message')}
          className="h-10 w-full max-w-64"
          controls
          src={source}
          onError={() => {
            URL.revokeObjectURL(source);
            audioUrl.current = null;
            setSource(undefined);
            setFailed(true);
          }}
        />
      ) : (
        <Button size="sm" type="button" variant="outline" disabled={loading} onClick={() => void loadAudio()}>
          <Play aria-hidden="true" />
          {loading ? text('Loading audio…') : text('Load audio')}
        </Button>
      )}
      {failed && (
        <p className="text-xs" role="alert">
          {text('Could not play this audio. Try downloading it.')}
        </p>
      )}
      <a className="block text-xs underline underline-offset-2" href={url}>
        {text('Download audio')}
      </a>
    </div>
  );
}
