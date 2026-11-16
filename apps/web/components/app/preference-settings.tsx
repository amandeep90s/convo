'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest } from '@/lib/client/api';

type Settings = {
  language: string;
  theme: string;
  read_receipts: boolean;
  last_seen_visibility: 'everyone' | 'contacts' | 'nobody';
  online_visibility: 'everyone' | 'contacts' | 'nobody';
  profile_visibility: 'everyone' | 'contacts' | 'nobody';
  notification_enabled: boolean;
};
type Section = 'appearance' | 'language' | 'privacy' | 'notifications' | 'chats';
type Update = Partial<Settings>;

const sectionInfo: Record<Section, { title: string; description: string }> = {
  appearance: { title: 'Appearance', description: 'Set the theme and preferred language for your account.' },
  language: { title: 'Language', description: 'Choose the language preference saved to your account.' },
  privacy: { title: 'Privacy', description: 'Control profile and presence visibility for other people.' },
  notifications: { title: 'Notifications', description: 'Choose whether account notifications are enabled.' },
  chats: { title: 'Chat preferences', description: 'Choose whether read receipts are shared with other participants.' },
};

export function PreferenceSettings({ section }: { section: Section }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiRequest<Settings>('user-settings'),
    retry: false,
  });
  const updateSettings = useMutation({
    mutationFn: (body: Update) => apiRequest<Settings>('user-settings', { method: 'PATCH', body }),
    onSuccess: async (settings) => {
      setSubmitError(null);
      setNotice('Your preferences have been saved.');
      if (section === 'appearance') setTheme(settings.theme);
      if (section === 'appearance' || section === 'language') {
        document.cookie = `locale=${settings.language}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }
      await queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (reason) =>
      setSubmitError(reason instanceof ApiError ? reason.message : 'Could not save your preferences.'),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const update: Update = {};
    if (section === 'appearance') {
      update.theme = String(formData.get('theme') ?? 'system');
      update.language = String(formData.get('language') ?? 'en');
    } else if (section === 'language') {
      update.language = String(formData.get('language') ?? 'en');
    } else if (section === 'privacy') {
      const profileVisibility = getVisibility(formData.get('profile_visibility'));
      const onlineVisibility = getVisibility(formData.get('online_visibility'));
      const lastSeenVisibility = getVisibility(formData.get('last_seen_visibility'));
      if (!profileVisibility || !onlineVisibility || !lastSeenVisibility) {
        setSubmitError('Choose a valid visibility option for each preference.');
        return;
      }
      update.profile_visibility = profileVisibility;
      update.online_visibility = onlineVisibility;
      update.last_seen_visibility = lastSeenVisibility;
    } else if (section === 'notifications') {
      update.notification_enabled = formData.get('notification_enabled') === 'on';
    } else {
      update.read_receipts = formData.get('read_receipts') === 'on';
    }
    setNotice(null);
    setSubmitError(null);
    updateSettings.mutate(update);
  }

  const info = sectionInfo[section];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{info.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{info.description}</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isPending && <p className="text-sm text-muted-foreground">Loading preferences…</p>}
          {query.isError && (
            <p className="text-sm text-destructive" role="alert">
              {query.error.message}
            </p>
          )}
          {query.data && (
            <form className="flex flex-col gap-5" onSubmit={submit}>
              {(section === 'appearance' || section === 'language') && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-language">Language</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
                    defaultValue={query.data.language}
                    id="settings-language"
                    name="language"
                  >
                    <option value="en">English</option>
                    <option value="pa">Punjabi</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              )}
              {section === 'appearance' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-theme">Theme</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
                    defaultValue={query.data.theme}
                    id="settings-theme"
                    name="theme"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              )}
              {section === 'privacy' && (
                <>
                  <VisibilitySelect
                    label="Profile visibility"
                    name="profile_visibility"
                    value={query.data.profile_visibility}
                  />
                  <VisibilitySelect
                    label="Online status visibility"
                    name="online_visibility"
                    value={query.data.online_visibility}
                  />
                  <VisibilitySelect
                    label="Last seen visibility"
                    name="last_seen_visibility"
                    value={query.data.last_seen_visibility}
                  />
                </>
              )}
              {section === 'notifications' && (
                <BooleanSetting
                  checked={query.data.notification_enabled}
                  description="Allow notifications for account activity."
                  label="Notifications enabled"
                  name="notification_enabled"
                />
              )}
              {section === 'chats' && (
                <BooleanSetting
                  checked={query.data.read_receipts}
                  description="Let people in your conversations know when you have read their messages."
                  label="Read receipts"
                  name="read_receipts"
                />
              )}
              {notice && (
                <p className="text-sm text-green-700 dark:text-green-400" role="status">
                  {notice}
                </p>
              )}
              {submitError && (
                <p className="text-sm text-destructive" role="alert">
                  {submitError}
                </p>
              )}
              <div>
                <Button disabled={updateSettings.isPending} type="submit">
                  {updateSettings.isPending ? 'Saving…' : 'Save preferences'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getVisibility(value: FormDataEntryValue | null): Settings['profile_visibility'] | null {
  if (value === 'everyone' || value === 'contacts' || value === 'nobody') return value;
  return null;
}

function VisibilitySelect({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: Settings['profile_visibility'];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
        defaultValue={value}
        id={name}
        name={name}
      >
        <option value="everyone">Everyone</option>
        <option value="contacts">Contacts only</option>
        <option value="nobody">Nobody</option>
      </select>
    </div>
  );
}

function BooleanSetting({
  checked,
  description,
  label,
  name,
}: {
  checked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border p-4">
      <input className="mt-1 size-4 accent-primary" defaultChecked={checked} name={name} type="checkbox" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
