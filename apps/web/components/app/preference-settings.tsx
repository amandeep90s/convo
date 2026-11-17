'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserSettingsSchema,
  type TUserSettings,
  type UpdateUserSettingsDto,
  visibilitySchema,
} from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CircleCheck, Eye, Languages, MessageCircle, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import { BrowserNotifications } from '@/components/app/browser-notifications';
import { NotificationSoundSettings } from '@/components/app/notification-sound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';

type Section = 'appearance' | 'language' | 'privacy' | 'notifications' | 'chats';

const preferenceFormSchema = createUserSettingsSchema.extend({
  language: createUserSettingsSchema.shape.language.unwrap(),
  theme: createUserSettingsSchema.shape.theme.unwrap(),
  read_receipts: z.boolean(),
  last_seen_visibility: visibilitySchema,
  online_visibility: visibilitySchema,
  profile_visibility: visibilitySchema,
  notification_enabled: z.boolean(),
});

type PreferenceValues = z.output<typeof preferenceFormSchema>;

const sectionInfo: Record<Section, { title: string; description: string; icon: typeof Monitor }> = {
  appearance: {
    title: 'Appearance',
    description: 'Choose the colors and language that make Convo feel like yours.',
    icon: Monitor,
  },
  language: {
    title: 'Language',
    description: 'Choose the language used across your Convo experience.',
    icon: Languages,
  },
  privacy: {
    title: 'Privacy',
    description: 'Decide who can see your profile and presence.',
    icon: Eye,
  },
  notifications: {
    title: 'Notifications',
    description: 'Manage account notifications for important activity.',
    icon: Bell,
  },
  chats: {
    title: 'Chat preferences',
    description: 'Choose whether read receipts are shared with other people.',
    icon: MessageCircle,
  },
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'hi', label: 'Hindi' },
] as const;

const themes = [
  { value: 'system', label: 'Use device setting' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export function PreferenceSettings({ section }: { section: Section }) {
  const text = useUiText();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiRequest<TUserSettings>('user-settings'),
    retry: false,
  });
  const updateSettings = useMutation({
    mutationFn: (body: UpdateUserSettingsDto) => apiRequest<TUserSettings>('user-settings', { method: 'PATCH', body }),
    onSuccess: async (settings) => {
      setSubmitError(null);
      setNotice(text('Your preferences have been saved.'));
      if (section === 'appearance') setTheme(settings.theme);
      if (section === 'appearance' || section === 'language') {
        document.cookie = `locale=${settings.language}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }
      await queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (reason) =>
      setSubmitError(reason instanceof ApiError ? reason.message : text('Could not save your preferences.')),
  });

  function submit(values: PreferenceValues) {
    const update: UpdateUserSettingsDto =
      section === 'appearance'
        ? { theme: values.theme, language: values.language }
        : section === 'language'
          ? { language: values.language }
          : section === 'privacy'
            ? {
                profile_visibility: values.profile_visibility,
                online_visibility: values.online_visibility,
                last_seen_visibility: values.last_seen_visibility,
              }
            : section === 'notifications'
              ? { notification_enabled: values.notification_enabled }
              : { read_receipts: values.read_receipts };

    setNotice(null);
    setSubmitError(null);
    updateSettings.mutate(update);
  }

  const info = sectionInfo[section];
  const Icon = info.icon;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{text('Account center')}</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Icon aria-hidden="true" className="size-6 text-primary" />
          {text(info.title)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{text(info.description)}</p>
      </header>
      <Card>
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle>{text('Preferences')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {query.isPending && <PreferenceStatus>{text('Loading preferences…')}</PreferenceStatus>}
          {query.isError && (
            <PreferenceStatus role="alert">
              {text('Could not load preferences.')} {text(query.error.message)}
            </PreferenceStatus>
          )}
          {query.data && (
            <PreferenceForm
              key={section}
              section={section}
              settings={query.data}
              isPending={updateSettings.isPending}
              notice={notice}
              submitError={submitError}
              onSubmit={submit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceForm({
  section,
  settings,
  isPending,
  notice,
  submitError,
  onSubmit,
}: {
  section: Section;
  settings: TUserSettings;
  isPending: boolean;
  notice: string | null;
  submitError: string | null;
  onSubmit: (values: PreferenceValues) => void;
}) {
  const text = useUiText();
  const defaultValues = useMemo(
    () => ({
      language: settings.language,
      theme: settings.theme,
      read_receipts: settings.read_receipts,
      last_seen_visibility: settings.last_seen_visibility,
      online_visibility: settings.online_visibility,
      profile_visibility: settings.profile_visibility,
      notification_enabled: settings.notification_enabled,
    }),
    [settings],
  );
  const form = useForm<z.input<typeof preferenceFormSchema>, unknown, PreferenceValues>({
    resolver: zodResolver(preferenceFormSchema),
    defaultValues,
  });
  const { register, handleSubmit, reset, formState } = form;

  useEffect(() => reset(defaultValues), [defaultValues, reset]);

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      {(section === 'appearance' || section === 'language') && (
        <SettingSelect
          description={text('Used for menus and account screens.')}
          id="settings-language"
          label={text('Language')}
          options={languages}
          registration={register('language')}
          value={settings.language}
          error={formState.errors.language?.message}
        />
      )}
      {section === 'appearance' && (
        <SettingSelect
          description={text('This preference follows your account on other signed-in devices.')}
          id="settings-theme"
          label={text('Theme')}
          options={themes}
          registration={register('theme')}
          value={settings.theme}
          error={formState.errors.theme?.message}
        />
      )}
      {section === 'privacy' && (
        <div className="grid gap-4">
          <VisibilitySelect
            description={text('Who can view your profile details.')}
            label={text('Profile visibility')}
            registration={register('profile_visibility')}
          />
          <VisibilitySelect
            description={text('Who can see when you are online.')}
            label={text('Online status')}
            registration={register('online_visibility')}
          />
          <VisibilitySelect
            description={text('Who can see when you were last active.')}
            label={text('Last seen')}
            registration={register('last_seen_visibility')}
          />
        </div>
      )}
      {section === 'notifications' && (
        <>
          <BooleanSetting
            description={text('Show incoming message alerts for unmuted conversations.')}
            label={text('Notifications enabled')}
            registration={register('notification_enabled')}
          />
          <BrowserNotifications />
          <NotificationSoundSettings />
        </>
      )}
      {section === 'chats' && (
        <BooleanSetting
          description={text('Let people in your conversations know when you have read their messages.')}
          label={text('Read receipts')}
          registration={register('read_receipts')}
        />
      )}
      {notice && (
        <p className="flex items-center gap-2 text-sm text-primary" role="status">
          <CircleCheck aria-hidden="true" className="size-4" />
          {text(notice)}
        </p>
      )}
      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {text(submitError)}
        </p>
      )}
      <div>
        <Button
          className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-5 font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
          disabled={isPending}
          type="submit"
        >
          {isPending ? text('Saving preferences…') : text('Save preferences')}
        </Button>
      </div>
    </form>
  );
}

function SettingSelect({
  description,
  id,
  label,
  options,
  registration,
  value,
  error,
}: {
  description: string;
  id: string;
  label: string;
  options: readonly { value: string; label: string }[];
  registration: UseFormRegisterReturn;
  value: string;
  error?: string;
}) {
  const text = useUiText();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{text(label)}</Label>
      <select
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 rounded-xl border border-input bg-background/70 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        id={id}
        {...registration}
      >
        {!options.some((option) => option.value === value) && (
          <option value={value}>{text('Current setting ({value0})', { value0: value })}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {text(option.label)}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs font-medium text-destructive" id={`${id}-error`}>
          {text(error)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{text(description)}</p>
      )}
    </div>
  );
}

function VisibilitySelect({
  description,
  label,
  registration,
}: {
  description: string;
  label: string;
  registration: UseFormRegisterReturn;
}) {
  const text = useUiText();
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <Label className="text-sm font-medium">{text(label)}</Label>
        <span className="mt-1 block text-xs text-muted-foreground">{text(description)}</span>
      </span>
      <select
        aria-label={text(label)}
        className="h-10 min-w-40 rounded-xl border border-input bg-background px-3 text-sm"
        {...registration}
      >
        <option value="everyone">{text('Everyone')}</option>
        <option value="contacts">{text('Contacts only')}</option>
        <option value="nobody">{text('Nobody')}</option>
      </select>
    </div>
  );
}

function BooleanSetting({
  description,
  label,
  registration,
}: {
  description: string;
  label: string;
  registration: UseFormRegisterReturn;
}) {
  const text = useUiText();
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <span>
        <span className="block text-sm font-medium">{text(label)}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{text(description)}</span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input aria-label={text(label)} className="peer sr-only" type="checkbox" {...registration} />
        <span className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
      </span>
    </label>
  );
}

function PreferenceStatus({ children, role }: { children: React.ReactNode; role?: 'alert' }) {
  return (
    <p
      className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground"
      role={role}
    >
      {children}
    </p>
  );
}
