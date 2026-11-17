'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/client/use-current-user';

export function AccountSettings() {
  const { data: user, isPending, isError, error } = useCurrentUser();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review the email connected to your account and manage password recovery.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sign-in details</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending && <p className="text-sm text-muted-foreground">Loading account details…</p>}
          {isError && (
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
          {user && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium">Email address</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email_verified_at ? 'Email verified' : 'Email not verified'}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium">Password</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the verified email flow to reset your password.
                </p>
                <Button
                  className="mt-3"
                  nativeButton={false}
                  render={<Link href="/forgot-password" />}
                  variant="outline"
                >
                  Reset password
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Changing your email is not currently supported by the account API.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
