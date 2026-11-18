'use client';

import { MAX_MESSAGE_ATTACHMENT_BYTES } from '@repo/shared';
import { Mic, Send, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';

const formats = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
} as const;
const maxDurationMs = 5 * 60_000;

type Capture = {
  stream?: MediaStream;
  recorder?: MediaRecorder;
  timeout?: ReturnType<typeof setTimeout>;
  previewUrl?: string;
};

function release(capture: Capture) {
  clearTimeout(capture.timeout);
  if (capture.recorder) {
    capture.recorder.ondataavailable = null;
    capture.recorder.onstop = null;
    capture.recorder.onerror = null;
    if (capture.recorder.state !== 'inactive') capture.recorder.stop();
  }
  capture.stream?.getTracks().forEach((track) => track.stop());
  if (capture.previewUrl) URL.revokeObjectURL(capture.previewUrl);
}

export function VoiceNoteRecorder({
  disabled,
  sending,
  onActiveChange,
  onSend,
}: {
  disabled: boolean;
  sending: boolean;
  onActiveChange: (active: boolean) => void;
  onSend: (file: File) => Promise<boolean>;
}) {
  const text = useUiText();
  const current = useRef<Capture | null>(null);
  const [stage, setStage] = useState<'idle' | 'requesting' | 'recording' | 'stopping' | 'ready'>('idle');
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState<{ file: File; url: string }>();

  useEffect(
    () => () => {
      const capture = current.current;
      current.current = null;
      if (capture) release(capture);
    },
    [],
  );

  function discard() {
    const capture = current.current;
    current.current = null;
    if (capture) release(capture);
    setPreview(undefined);
    setStage('idle');
    onActiveChange(false);
  }

  function stop(capture: Capture) {
    if (current.current !== capture || capture.recorder?.state !== 'recording') return;
    clearTimeout(capture.timeout);
    setStage('stopping');
    capture.recorder.stop();
  }

  async function start() {
    if (disabled || current.current) return;
    setError(undefined);
    const mimeType = (Object.keys(formats) as Array<keyof typeof formats>).find(
      (format) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(format),
    );
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      setError(text('Voice recording requires a supported browser on HTTPS or localhost.'));
      return;
    }

    const capture: Capture = {};
    current.current = capture;
    onActiveChange(true);
    setStage('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current.current !== capture) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      capture.stream = stream;
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
      capture.recorder = recorder;
      let size = 0;
      const chunks: Blob[] = [];
      recorder.ondataavailable = ({ data }) => {
        if (!data.size) return;
        size += data.size;
        if (size > MAX_MESSAGE_ATTACHMENT_BYTES) {
          discard();
          setError(text('The recording is too large to send.'));
          return;
        }
        chunks.push(data);
      };
      recorder.onerror = () => {
        discard();
        setError(text('Could not record this voice note.'));
      };
      recorder.onstop = () => {
        clearTimeout(capture.timeout);
        stream.getTracks().forEach((track) => track.stop());
        if (!size) {
          discard();
          setError(text('Could not record this voice note.'));
          return;
        }
        const file = new File(chunks, `voice-note.${formats[mimeType]}`, { type: mimeType });
        const url = URL.createObjectURL(file);
        capture.previewUrl = url;
        setPreview({ file, url });
        setStage('ready');
      };
      recorder.start(1000);
      capture.timeout = setTimeout(() => stop(capture), maxDurationMs);
      setStage('recording');
    } catch (reason) {
      if (current.current !== capture) return;
      discard();
      setError(
        reason instanceof DOMException && reason.name === 'NotAllowedError'
          ? text('Allow microphone access to record a voice note.')
          : text('Could not record this voice note.'),
      );
    }
  }

  async function send() {
    const capture = current.current;
    if (!preview || disabled || sending || !capture) return;
    setError(undefined);
    if ((await onSend(preview.file)) && current.current === capture) discard();
  }

  return (
    <div className={stage === 'idle' ? 'shrink-0' : 'min-w-0 flex-1'}>
      {stage === 'idle' ? (
        <Button
          aria-label={text('Record a voice note')}
          size="icon"
          type="button"
          variant="ghost"
          disabled={disabled}
          onClick={() => void start()}
        >
          <Mic aria-hidden="true" />
        </Button>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-2">
          <Button
            aria-label={text('Discard recording')}
            size="icon-sm"
            type="button"
            variant="ghost"
            disabled={sending}
            onClick={discard}
          >
            <X aria-hidden="true" />
          </Button>
          {preview ? (
            <audio className="h-10 min-w-0 flex-1" src={preview.url} controls aria-label={text('Voice note preview')} />
          ) : (
            <p className="min-w-0 flex-1 text-sm" role="status">
              {stage === 'requesting'
                ? text('Waiting for microphone access…')
                : stage === 'stopping'
                  ? text('Preparing voice note…')
                  : text('Recording voice note…')}
            </p>
          )}
          {stage === 'recording' && (
            <Button
              aria-label={text('Stop recording')}
              size="icon"
              type="button"
              onClick={() => current.current && stop(current.current)}
            >
              <Square aria-hidden="true" />
            </Button>
          )}
          {stage === 'ready' && (
            <Button
              aria-label={sending ? text('Uploading attachment…') : text('Send voice note')}
              size="icon"
              type="button"
              disabled={disabled || sending}
              onClick={() => void send()}
            >
              <Send aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
