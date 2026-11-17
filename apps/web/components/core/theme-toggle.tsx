'use client';

import type { TUserSettings } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function ThemeToggle({ persist = false }: { persist?: boolean }) {
  const text = useUiText();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const settings = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiRequest<TUserSettings>('user-settings'),
    retry: false,
    enabled: persist,
  });
  const saveTheme = useMutation({
    mutationFn: (nextTheme: (typeof themes)[number]['value']) =>
      apiRequest<TUserSettings>('user-settings', { method: 'PATCH', body: { theme: nextTheme } }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (reason) =>
      setError(
        reason instanceof ApiError ? reason.message : text('The theme changed on this device but could not be saved.'),
      ),
  });

  useEffect(() => {
    if (persist && settings.data?.theme && themes.some(({ value }) => value === settings.data.theme)) {
      setTheme(settings.data.theme);
    }
  }, [persist, settings.data?.theme, setTheme]);

  function chooseTheme(nextTheme: (typeof themes)[number]['value']) {
    setTheme(nextTheme);
    setError(null);
    if (persist) saveTheme.mutate(nextTheme);
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label={text('Choose appearance theme')} className="rounded-xl" size="icon" variant="outline">
              <Sun className="size-[1.15rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-[1.15rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">{text('Choose appearance theme')}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-44 rounded-xl p-1.5">
          <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{text('Appearance')}</p>
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem className="cursor-pointer rounded-lg" key={value} onClick={() => chooseTheme(value)}>
              <Icon aria-hidden="true" className="size-4" />
              {text(label)}
              {theme === value && <Check aria-hidden="true" className="ml-auto size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          {persist && settings.isError && (
            <p className="px-2.5 py-2 text-xs text-destructive" role="alert">
              {text('Saved theme is unavailable. You can still change this device’s appearance.')}
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span aria-live="polite" className="hidden max-w-44 text-xs text-destructive sm:inline" role="alert">
          {text(error)}
        </span>
      )}
    </div>
  );
}
