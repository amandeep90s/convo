'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type UpdateUserDto, updateUserSchema } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, CircleCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiRequest } from '@/lib/client/api';
import { useCurrentUser } from '@/lib/client/use-current-user';

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const { data: user, isPending, isError, error } = useCurrentUser();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateProfile = useMutation({
    mutationFn: (body: UpdateUserDto) => apiRequest('users/me', { method: 'PATCH', body }),
    onSuccess: async () => {
      setSubmitError(null);
      setNotice('Your profile has been updated.');
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (reason) => setSubmitError(reason instanceof ApiError ? reason.message : 'Could not update your profile.'),
  });

  if (isPending) {
    return <ProfileStatus>Loading your profile…</ProfileStatus>;
  }
  if (isError) {
    return <ProfileStatus role="alert">Could not load your profile. {error.message}</ProfileStatus>;
  }
  if (!user) {
    return <ProfileStatus role="alert">Your profile is unavailable.</ProfileStatus>;
  }

  return (
    <ProfileEditor
      about={user.about ?? ''}
      avatarUrl={user.avatar_url ?? ''}
      name={user.name}
      username={user.username}
      isPending={updateProfile.isPending}
      notice={notice}
      submitError={submitError}
      onSubmit={(data) => {
        setNotice(null);
        setSubmitError(null);
        updateProfile.mutate(data);
      }}
    />
  );
}

function ProfileEditor({
  name,
  username,
  about,
  avatarUrl,
  isPending,
  notice,
  submitError,
  onSubmit,
}: {
  name: string;
  username: string;
  about: string;
  avatarUrl: string;
  isPending: boolean;
  notice: string | null;
  submitError: string | null;
  onSubmit: (data: UpdateUserDto) => void;
}) {
  const form = useForm<z.input<typeof updateUserSchema>, unknown, UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name, username, about, avatar_url: avatarUrl || undefined },
  });
  const errors = form.formState.errors;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Account center</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose the details people see when they connect with you.</p>
      </header>
      <Card>
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-4 text-primary" />
            Public profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/[0.08] to-transparent p-4">
            <Avatar className="size-16 shrink-0 bg-gradient-to-br from-emerald-100 to-teal-200 text-xl font-semibold text-primary dark:from-emerald-950 dark:to-teal-900">
              <AvatarImage alt="" src={avatarUrl || undefined} />
              <AvatarFallback className="bg-transparent font-semibold text-primary">
                {name.trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              <span className="block font-medium">{name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">@{username}</span>
            </span>
            <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
              <Camera aria-hidden="true" className="size-3.5" />
              Avatar URL supported
            </span>
          </div>
          <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                autoComplete="name"
                aria-describedby={errors.name ? 'profile-name-error' : undefined}
                aria-invalid={Boolean(errors.name)}
                className="h-11 rounded-xl bg-background/70 px-3"
                id="profile-name"
                maxLength={100}
                {...form.register('name')}
              />
              {errors.name?.message && (
                <p className="text-xs font-medium text-destructive" id="profile-name-error">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-username">Username</Label>
              <Input
                autoComplete="username"
                aria-describedby={errors.username ? 'profile-username-error' : undefined}
                aria-invalid={Boolean(errors.username)}
                className="h-11 rounded-xl bg-background/70 px-3"
                id="profile-username"
                maxLength={50}
                {...form.register('username')}
              />
              {errors.username?.message && (
                <p className="text-xs font-medium text-destructive" id="profile-username-error">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-about">About</Label>
              <Textarea
                aria-describedby={errors.about ? 'profile-about-error' : undefined}
                aria-invalid={Boolean(errors.about)}
                className="min-h-28 rounded-xl bg-background/70 px-3 py-2.5"
                id="profile-about"
                maxLength={1000}
                {...form.register('about')}
              />
              {errors.about?.message ? (
                <p className="text-xs font-medium text-destructive" id="profile-about-error">
                  {errors.about.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Up to 1,000 characters.</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-avatar-url">Avatar image URL</Label>
              <Input
                autoComplete="url"
                aria-describedby={errors.avatar_url ? 'profile-avatar-url-error' : 'profile-avatar-url-hint'}
                aria-invalid={Boolean(errors.avatar_url)}
                className="h-11 rounded-xl bg-background/70 px-3"
                id="profile-avatar-url"
                inputMode="url"
                placeholder="https://example.com/avatar.jpg"
                {...form.register('avatar_url', {
                  setValueAs: (value: string) => (value.trim() ? value.trim() : undefined),
                })}
              />
              {errors.avatar_url?.message ? (
                <p className="text-xs font-medium text-destructive" id="profile-avatar-url-error">
                  {errors.avatar_url.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground" id="profile-avatar-url-hint">
                  Paste an image URL. File uploads are not available in the profile API.
                </p>
              )}
            </div>
            {notice && (
              <p className="flex items-center gap-2 text-sm text-primary" role="status">
                <CircleCheck aria-hidden="true" className="size-4" />
                {notice}
              </p>
            )}
            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
            <div>
              <Button
                className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-5 font-semibold shadow-lg shadow-primary/20 hover:brightness-105"
                disabled={isPending}
                type="submit"
              >
                {isPending ? 'Saving profile…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileStatus({ children, role }: { children: React.ReactNode; role?: 'alert' }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Account center</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your profile</h1>
      </header>
      <p className="rounded-2xl border border-border/70 bg-card/80 px-5 py-8 text-sm text-muted-foreground" role={role}>
        {children}
      </p>
    </div>
  );
}
