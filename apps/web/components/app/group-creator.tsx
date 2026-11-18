'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateGroupDto, createGroupSchema } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUiText } from '@/i18n/ui-text';
import { ApiError, apiRequest } from '@/lib/client/api';

export function GroupCreator() {
  const text = useUiText();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof createGroupSchema>, unknown, CreateGroupDto>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '', description: '' },
  });
  const createGroup = useMutation({
    mutationFn: (body: CreateGroupDto) => apiRequest<{ conversation_id: string }>('groups', { method: 'POST', body }),
    onSuccess: async ({ conversation_id }) => {
      setIsOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/chat/${conversation_id}`);
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason.message : text('Could not create the group.')),
  });

  function submit(data: CreateGroupDto) {
    setError(null);
    createGroup.mutate(data);
  }

  return (
    <div className="relative">
      <Button className="rounded-xl" onClick={() => setIsOpen((open) => !open)} type="button" variant="outline">
        <Plus aria-hidden="true" />
        {isOpen ? text('Cancel') : text('New group')}
      </Button>
      {isOpen && (
        <Card className="absolute top-full right-0 z-20 mt-2 w-[min(85vw,20rem)] shadow-lg">
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
              <div className="flex items-center gap-2 font-medium">
                <Users aria-hidden="true" className="size-4 text-primary" />
                {text('Create a group chat')}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-name">{text('Group name')}</Label>
                <Input
                  aria-describedby={form.formState.errors.name ? 'group-name-error' : undefined}
                  aria-invalid={Boolean(form.formState.errors.name)}
                  className="h-11 rounded-xl bg-background/70 px-3"
                  id="group-name"
                  maxLength={100}
                  {...form.register('name')}
                />
                {form.formState.errors.name?.message && (
                  <p className="text-xs font-medium text-destructive" id="group-name-error">
                    {text(form.formState.errors.name.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-description">{text('Description')}</Label>
                <Textarea
                  className="min-h-24 rounded-xl bg-background/70 px-3 py-2.5"
                  id="group-description"
                  maxLength={1000}
                  {...form.register('description')}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {text(error)}
                </p>
              )}
              <div>
                <Button
                  className="h-11 rounded-xl bg-gradient-to-r from-[#087e64] to-[#12a178] px-5 font-semibold shadow-lg shadow-primary/15 hover:brightness-105"
                  disabled={createGroup.isPending}
                  type="submit"
                >
                  {createGroup.isPending ? text('Creating…') : text('Create group')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
