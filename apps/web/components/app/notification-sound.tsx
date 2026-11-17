'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUiText } from '@/i18n/ui-text';

const STORAGE_KEY = 'convo_notification_sound';
type SoundControls = { enabled: boolean; pending: boolean; toggle: () => Promise<void>; play: () => void };
const SoundContext = createContext<SoundControls | null>(null);

export function NotificationSoundProvider({ children }: { children: ReactNode }) {
  const text = useUiText();
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const changing = useRef(false);
  const enabledRef = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const lastPlayed = useRef(-Infinity);

  const unlock = useCallback(async () => {
    if (!window.AudioContext) throw new Error('Notification sound is unavailable in this browser.');
    audio.current ??= new AudioContext();
    if (audio.current.state === 'suspended') await audio.current.resume();
  }, []);

  const play = useCallback(() => {
    const context = audio.current;
    // Autoplay restrictions require a user gesture before the context can run.
    if (!enabledRef.current || !context || context.state !== 'running') return;
    if (context.currentTime - lastPlayed.current < 0.75) return;
    lastPlayed.current = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.1);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  }, []);

  useEffect(() => {
    function load() {
      try {
        enabledRef.current = localStorage.getItem(STORAGE_KEY) === 'true';
        setEnabled(enabledRef.current);
      } catch {
        setError(true);
      }
    }
    function storage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) load();
    }
    function gesture() {
      if (enabledRef.current) void unlock().catch(() => setError(true));
    }
    load();
    window.addEventListener('storage', storage);
    window.addEventListener('pointerdown', gesture);
    window.addEventListener('keydown', gesture);
    return () => {
      window.removeEventListener('storage', storage);
      window.removeEventListener('pointerdown', gesture);
      window.removeEventListener('keydown', gesture);
      const context = audio.current;
      audio.current = null;
      if (context && context.state !== 'closed') void context.close().catch(() => setError(true));
    };
  }, [unlock]);

  async function toggle() {
    if (changing.current) return;
    changing.current = true;
    setPending(true);
    try {
      const next = !enabledRef.current;
      if (next) await unlock();
      localStorage.setItem(STORAGE_KEY, String(next));
      enabledRef.current = next;
      setEnabled(next);
      setError(false);
      if (next) play();
    } catch {
      setError(true);
    } finally {
      changing.current = false;
      setPending(false);
    }
  }

  return (
    <SoundContext.Provider value={{ enabled, pending, toggle, play }}>
      {error && (
        <p className="border-b bg-background p-3 text-sm text-destructive" role="alert">
          {text('Could not enable or play notification sound. Check your browser permissions and storage settings.')}
        </p>
      )}
      {children}
    </SoundContext.Provider>
  );
}

export function useNotificationSound() {
  const controls = useContext(SoundContext);
  if (!controls) throw new Error('NotificationSoundProvider is required');
  return controls;
}

export function NotificationSoundSettings() {
  const text = useUiText();
  const { enabled, pending, toggle } = useNotificationSound();
  return (
    <div className="rounded-2xl border border-border/70 p-4 text-sm">
      <p className="font-medium">{text('Notification sound')}</p>
      <p className="mt-1 text-muted-foreground">
        {text(
          'Play a short sound for new message alerts. Saved on this browser only. Click or press a key after opening the app to allow sound.',
        )}
      </p>
      <Button
        aria-pressed={enabled}
        disabled={pending}
        className="mt-3"
        onClick={() => void toggle()}
        type="button"
        variant="outline"
      >
        {text(enabled ? 'Disable notification sound' : 'Enable notification sound')}
      </Button>
    </div>
  );
}
