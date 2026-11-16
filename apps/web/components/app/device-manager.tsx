'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, apiRequest } from '@/lib/client/api';

type Device = {
  id: string;
  device_type: string;
  device_name: string | null;
  last_seen_at: string | null;
  created_at: string;
  sessions: Array<{ id: string; ip_address: string | null; created_at: string; expires_at: string }>;
};

export function DeviceManager() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const devices = useQuery({
    queryKey: ['user-devices'],
    queryFn: () => apiRequest<Device[]>('user-devices'),
    retry: false,
  });
  const revoke = useMutation({
    mutationFn: (deviceId: string) => apiRequest(`user-devices/${deviceId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-devices'] }),
        queryClient.invalidateQueries({ queryKey: ['user-sessions'] }),
      ]);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not revoke this device.'),
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Devices</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review devices registered to your account and revoke access you no longer need.
        </p>
      </header>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {devices.isPending && <Status>Loading registered devices…</Status>}
      {devices.isError && <Status role="alert">Could not load registered devices. {devices.error.message}</Status>}
      {devices.isSuccess && devices.data.length === 0 && <Status>No registered devices found.</Status>}
      {devices.isSuccess &&
        devices.data.map((device) => (
          <Card key={device.id}>
            <CardContent className="flex-row items-center justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Smartphone aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{device.device_name || device.device_type}</p>
                  <p className="text-sm text-muted-foreground">
                    Last active {device.last_seen_at ? formatDate(device.last_seen_at) : 'not available'}
                  </p>
                  <p className="text-xs text-muted-foreground">{device.sessions.length} active session(s)</p>
                </div>
              </div>
              <Button
                disabled={revoke.isPending && revoke.variables === device.id}
                onClick={() => revoke.mutate(device.id)}
                type="button"
                variant="outline"
              >
                Revoke
              </Button>
            </CardContent>
          </Card>
        ))}
      <p className="text-xs text-muted-foreground">
        Device enrollment is managed during sign-in; manual registration is not available in this web interface.
      </p>
    </div>
  );
}

function Status({ children, role }: { children: ReactNode; role?: 'alert' }) {
  return (
    <p className="rounded-xl border bg-background px-5 py-8 text-center text-sm text-muted-foreground" role={role}>
      {children}
    </p>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown time' : date.toLocaleString();
}
