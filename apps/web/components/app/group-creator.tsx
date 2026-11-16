'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiRequest } from '@/lib/client/api';

export function GroupCreator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createGroup = useMutation({
    mutationFn: (body: { name: string; description: string }) =>
      apiRequest<{ conversation_id: string }>('groups', { method: 'POST', body }),
    onSuccess: async ({ conversation_id }) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/chat/${conversation_id}`);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : 'Could not create the group.'),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    if (!name) {
      setError('Group name is required.');
      return;
    }
    setError(null);
    createGroup.mutate({ name, description: String(formData.get('description') ?? '').trim() });
  }

  return (
    <div className="relative">
      <Button onClick={() => setIsOpen((open) => !open)} type="button" variant="outline">
        <Plus aria-hidden="true" />
        {isOpen ? 'Cancel' : 'New group'}
      </Button>
      {isOpen && (
        <Card className="absolute top-full right-0 z-10 mt-2 w-[min(90vw,28rem)] shadow-lg">
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <div className="flex items-center gap-2 font-medium">
                <Users aria-hidden="true" className="size-4 text-primary" />
                Create a group chat
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-name">Group name</Label>
                <Input id="group-name" maxLength={100} name="name" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-description">Description</Label>
                <Textarea id="group-description" maxLength={1000} name="description" />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div>
                <Button disabled={createGroup.isPending} type="submit">
                  {createGroup.isPending ? 'Creating…' : 'Create group'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
