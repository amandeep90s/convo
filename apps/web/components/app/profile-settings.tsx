'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';

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
    mutationFn: (body: { name: string; username: string; about: string }) =>
      apiRequest('users/me', { method: 'PATCH', body }),
    onSuccess: async () => {
      setSubmitError(null);
      setNotice('Your profile has been updated.');
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (reason) => setSubmitError(reason instanceof ApiError ? reason.message : 'Could not update your profile.'),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const username = String(formData.get('username') ?? '').trim();
    const about = String(formData.get('about') ?? '').trim();
    if (!name || username.length < 3) {
      setSubmitError('Enter a name and a username with at least 3 characters.');
      return;
    }
    setNotice(null);
    setSubmitError(null);
    updateProfile.mutate({ name, username, about });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose the details people see when they connect with you.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending && <p className="text-sm text-muted-foreground">Loading your profile…</p>}
          {isError && (
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
          {user && (
            <form className="flex flex-col gap-5" onSubmit={submit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  autoComplete="name"
                  defaultValue={user.name}
                  id="profile-name"
                  maxLength={100}
                  name="name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  autoComplete="username"
                  defaultValue={user.username}
                  id="profile-username"
                  maxLength={50}
                  minLength={3}
                  name="username"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-about">About</Label>
                <Textarea defaultValue={user.about ?? ''} id="profile-about" maxLength={1000} name="about" />
                <p className="text-xs text-muted-foreground">Up to 1,000 characters.</p>
              </div>
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
                <Button disabled={updateProfile.isPending} type="submit">
                  {updateProfile.isPending ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
