import { expect, type Page, test, type WebSocketRoute } from '@playwright/test';

async function signInAsTestUser(page: Page) {
  const sockets: WebSocketRoute[] = [];
  await page.route('**/api/backend/realtime/session', (route) =>
    route.fulfill({
      json: {
        success: true,
        statusCode: 201,
        message: 'Socket ticket issued',
        data: { token: 'socket-only-ticket', url: 'http://127.0.0.1:3000' },
      },
    }),
  );
  await page.route('**/api/backend/user-settings', (route) =>
    route.fulfill({
      json: {
        success: true,
        statusCode: 200,
        message: 'Settings loaded',
        data: {
          language: 'en',
          theme: 'system',
          read_receipts: true,
          notification_enabled: true,
          profile_visibility: 'everyone',
          online_visibility: 'contacts',
          last_seen_visibility: 'contacts',
        },
      },
    }),
  );
  await page.route('**/api/backend/message-receipts/**', (route) =>
    route.fulfill({
      json: { success: true, statusCode: 200, message: 'Receipt saved', data: {} },
    }),
  );
  await page.routeWebSocket('**/socket.io/**', (socket) => {
    socket.send(`0${JSON.stringify({ sid: 'engine-test', upgrades: [], pingInterval: 25000, pingTimeout: 20000 })}`);
    socket.onMessage((packet) => {
      if (typeof packet === 'string' && packet.startsWith('40')) {
        expect(JSON.parse(packet.slice(2))).toEqual({ token: 'socket-only-ticket' });
        sockets.push(socket);
        socket.send('40{"sid":"socket-test"}');
      }
    });
  });
  await page.context().addCookies([
    {
      name: 'convo_access_token',
      value: 'playwright-access-token',
      url: 'http://127.0.0.1:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.route('**/api/backend/users/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        statusCode: 200,
        message: 'Current user loaded',
        data: {
          id: 'u1',
          email: 'alex@example.test',
          username: 'alex',
          name: 'Alex',
          about: null,
          avatar_url: null,
          status: 'active',
          email_verified_at: '2026-01-01T00:00:00.000Z',
        },
      }),
    });
  });
  return sockets;
}

test('incoming socket messages refresh the recipient list and visible chat without waiting for polling', async ({
  page,
}) => {
  const sockets = await signInAsTestUser(page);
  let hasMessage = false;
  let hasAttachment = false;
  const receipts: string[] = [];
  const person = { id: 'u2', username: 'jordan', name: 'Jordan', avatar_url: null };
  const message = {
    id: 'incoming-1',
    conversation_id: 'c1',
    sender_id: 'u2',
    type: 'text',
    content: 'Live message from Jordan',
    created_at: '2026-11-17T10:00:00.000Z',
    sender: person,
    receipts: [],
  };
  await page.route('**/api/backend/conversations?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        statusCode: 200,
        message: 'Conversations loaded',
        data: {
          data: hasMessage
            ? [
                {
                  id: 'c1',
                  name: null,
                  type: 'private',
                  last_message_at: message.created_at,
                  members: [
                    { user_id: 'u1', archived_at: null, starred_at: null, user: { id: 'u1', name: 'Alex' } },
                    { user_id: 'u2', archived_at: null, starred_at: null, user: person },
                  ],
                  messages: [message],
                },
              ]
            : [],
          total: hasMessage ? 1 : 0,
        },
      },
    }),
  );
  await page.route('**/api/backend/conversations/c1', (route) =>
    route.fulfill({
      json: {
        success: true,
        statusCode: 200,
        message: 'Conversation loaded',
        data: {
          id: 'c1',
          type: 'private',
          name: null,
          group: null,
          members: [{ user_id: 'u2', role: 'member', user: person }],
        },
      },
    }),
  );
  await page.route('**/api/backend/messages?*', (route) =>
    route.fulfill({
      json: {
        success: true,
        statusCode: 200,
        message: 'Messages loaded',
        data: {
          items: [
            {
              ...message,
              attachments: hasAttachment ? [{ id: 'a1', file_name: 'note.txt', mime_type: 'text/plain' }] : [],
            },
          ],
          hasMore: false,
          nextCursor: null,
        },
      },
    }),
  );
  await page.route('**/api/backend/message-receipts/**', (route) => {
    receipts.push(route.request().url());
    return route.fulfill({ json: { success: true, statusCode: 200, message: 'Receipt saved', data: {} } });
  });

  await page.goto('/chat');
  await expect(page.getByText('Your conversation list is empty.', { exact: false })).toBeVisible();
  await expect.poll(() => sockets.length).toBe(1);
  hasMessage = true;
  sockets[0]!.send(`42${JSON.stringify(['message:created', message])}`);
  sockets[0]!.send(`42${JSON.stringify(['message:notification', message])}`);
  await expect(page.getByRole('status', { name: 'New message' })).toContainText('Live message from Jordan');
  await expect(page.getByRole('link', { name: /Jordan/ }).first()).toBeVisible();
  await expect.poll(() => receipts.some((url) => url.endsWith('/incoming-1/delivered'))).toBe(true);

  await page.getByRole('status', { name: 'New message' }).getByRole('link').click();
  await expect(page.getByRole('region', { name: 'Messages' })).toContainText(message.content);
  await expect.poll(() => receipts.some((url) => url.endsWith('/incoming-1/read'))).toBe(true);
  hasAttachment = true;
  sockets[0]!.send(`42${JSON.stringify(['message:attachment', { conversation_id: 'c1', message_id: message.id }])}`);
  await expect(page.getByRole('link', { name: 'note.txt' })).toBeVisible();
  sockets[0]!.send(`42${JSON.stringify(['message:notification', { ...message, id: 'incoming-2' }])}`);
  await expect(page.getByRole('status', { name: 'New message' })).toHaveCount(0);
  await sockets[0]!.close();
  await expect.poll(() => sockets.length, { timeout: 10000 }).toBe(2);
  await expect(page.getByText('Live updates disconnected.', { exact: false })).toHaveCount(0);
});

test('home page renders the Convo application', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Convo');
  await expect(page.getByRole('heading', { name: 'Convo App' })).toBeVisible();
});

test('guest is redirected from the protected application', async ({ page }) => {
  await page.goto('/chat');

  await expect(page).toHaveURL(/\/login/);
});

test('conversation list loads through the authenticated same-origin API', async ({ page }) => {
  await signInAsTestUser(page);
  await page.route('**/api/backend/conversations?*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        statusCode: 200,
        message: 'Conversations loaded',
        data: {
          data: [
            {
              id: 'c1',
              name: null,
              type: 'private',
              last_message_at: '2026-11-16T10:00:00.000Z',
              members: [
                {
                  user_id: 'u1',
                  archived_at: null,
                  starred_at: null,
                  user: { id: 'u1', username: 'alex', name: 'Alex', avatar_url: null },
                },
                {
                  user_id: 'u2',
                  archived_at: null,
                  starred_at: null,
                  user: { id: 'u2', username: 'jordan', name: 'Jordan', avatar_url: null },
                },
              ],
              messages: [{ id: 'm1', type: 'text', content: 'See you soon', created_at: '2026-11-16T10:00:00.000Z' }],
            },
          ],
          page: 1,
          total: 1,
        },
      }),
    });
  });

  await page.goto('/chat');

  await expect(page.getByRole('heading', { name: 'Your conversations' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Jordan/ })).toBeVisible();
  await expect(page.getByText('See you soon')).toBeVisible();
});

test('conversation sends text through the authenticated same-origin API', async ({ page }) => {
  const sockets = await signInAsTestUser(page);
  let sentMessage = false;
  let receiptStatus: 'sent' | 'delivered' | 'read' = 'sent';
  await page.route('**/api/backend/conversations/c1', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        statusCode: 200,
        message: 'Conversation loaded',
        data: {
          id: 'c1',
          name: null,
          type: 'private',
          group: null,
          members: [
            { user_id: 'u1', role: 'admin', user: { id: 'u1', username: 'alex', name: 'Alex', avatar_url: null } },
            { user_id: 'u2', role: 'member', user: { id: 'u2', username: 'jordan', name: 'Jordan', avatar_url: null } },
          ],
        },
      }),
    });
  });
  await page.route('**/api/backend/messages**', async (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        conversation_id: 'c1',
        type: 'text',
        content: 'Hello Jordan',
      });
      sentMessage = true;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          statusCode: 201,
          message: 'Message sent',
          data: {
            id: 'm1',
            sender_id: 'u1',
            type: 'text',
            content: 'Hello Jordan',
            created_at: '2026-11-16T10:00:00.000Z',
            sender: { id: 'u1', username: 'alex', name: 'Alex', avatar_url: null },
            attachments: [],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        statusCode: 200,
        message: 'Messages loaded',
        data: {
          items: sentMessage
            ? [
                {
                  id: 'm1',
                  sender_id: 'u1',
                  type: 'text',
                  content: 'Hello Jordan',
                  created_at: '2026-11-16T10:00:00.000Z',
                  sender: { id: 'u1', username: 'alex', name: 'Alex', avatar_url: null },
                  attachments: [],
                  receipts: [
                    {
                      message_id: 'm1',
                      user_id: 'u2',
                      delivered_at: receiptStatus === 'sent' ? null : '2026-11-17T10:00:00.000Z',
                      read_at: receiptStatus === 'read' ? '2026-11-17T10:00:01.000Z' : null,
                    },
                  ],
                },
              ]
            : [],
          nextCursor: null,
          hasMore: false,
        },
      }),
    });
  });

  await page.goto('/chat/c1');
  await page.getByLabel('Write a message').fill('Hello Jordan');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Hello Jordan')).toBeVisible();
  expect(sentMessage).toBe(true);
  await expect(page.getByLabel('Sent', { exact: true })).toBeVisible();
  await expect.poll(() => sockets.length).toBe(1);
  for (const status of ['delivered', 'read'] as const) {
    receiptStatus = status;
    sockets[0]!.send(
      `42${JSON.stringify([
        'message:receipt',
        {
          conversation_id: 'c1',
          message_id: 'm1',
          user_id: 'u2',
        },
      ])}`,
    );
    await expect(page.getByLabel(status === 'read' ? 'Read' : 'Delivered', { exact: true })).toBeVisible();
  }
});

test('message search exposes query and filter controls', async ({ page }) => {
  await signInAsTestUser(page);
  await page.goto('/search');

  await expect(page.getByRole('heading', { name: 'Search messages' })).toBeVisible();
  await expect(page.getByLabel('Message text')).toBeVisible();
  await expect(page.getByLabel('Sender')).toBeVisible();
  await expect(page.getByLabel('From date')).toBeVisible();
  await expect(page.getByLabel('To date')).toBeVisible();
  await expect(page.getByLabel('Attachment')).toBeVisible();
});

test('message search submits filters and renders matching messages', async ({ page }) => {
  await signInAsTestUser(page);
  await page.route('**/api/messages/search**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('q')).toBe('project update');
    expect(url.searchParams.get('sender')).toBe('Alex');
    expect(url.searchParams.get('from')).toBeTruthy();
    expect(url.searchParams.get('to')).toBeTruthy();
    expect(url.searchParams.get('attachmentType')).toBe('image');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: 'm1',
              conversation_id: 'c1',
              type: 'text',
              content: 'Project update is ready',
              created_at: '2026-11-16T10:00:00.000Z',
              sender: { id: 'u1', username: 'alex', name: 'Alex', avatar_url: null },
              conversation: { id: 'c1', name: 'Team chat', type: 'group' },
              attachments: [],
            },
          ],
          page: 1,
          total: 1,
          totalPages: 1,
        },
      }),
    });
  });

  await page.goto('/search');
  await page.getByLabel('Message text').fill('project update');
  await page.getByLabel('Sender').fill('Alex');
  await page.getByLabel('From date').fill('2026-11-01');
  await page.getByLabel('To date').fill('2026-11-16');
  await page.getByLabel('Attachment').selectOption('image');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByText('Project update is ready')).toBeVisible();
  await expect(page.getByText('Team chat', { exact: false })).toBeVisible();
  await expect(page.getByText('1 result')).toBeVisible();
});
