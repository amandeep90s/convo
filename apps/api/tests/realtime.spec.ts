import { randomUUID } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { expect, type Page, test as base } from '@playwright/test';

import { PrismaService } from '../src/prisma.service';

declare global {
  interface Window {
    realtimeEvents: Array<
      [string, { id?: string; conversation_id?: string; message_id?: string }]
    >;
  }
}

const test = base.extend<{
  peers: {
    senderToken: string;
    senderId: string;
    recipientToken: string;
    recipientId: string;
    conversationId: string;
    db: PrismaService;
  };
}>({
  peers: async ({ request }, use) => {
    const config = new ConfigService(process.env);
    const db = new PrismaService(config);
    const jwt = new JwtService({
      secret: config.getOrThrow<string>('JWT_SECRET'),
      signOptions: {
        audience: config.getOrThrow<string>('JWT_TOKEN_AUDIENCE'),
        issuer: config.getOrThrow<string>('JWT_TOKEN_ISSUER'),
      },
    });
    const userIds: string[] = [];
    let conversationId: string | undefined;
    async function createPeer() {
      const suffix = randomUUID();
      const user = await db.user.create({
        data: {
          email: `${suffix}@example.test`,
          username: suffix,
          name: 'Realtime test',
        },
      });
      userIds.push(user.id);
      const device = await db.userDevice.create({
        data: { user_id: user.id, device_type: 'web' },
      });
      const session = await db.userSession.create({
        data: {
          user_id: user.id,
          device_id: device.id,
          refresh_token_hash: 'test-only',
          expires_at: new Date(Date.now() + 300_000),
        },
      });
      return {
        id: user.id,
        token: await jwt.signAsync(
          { sub: user.id, sid: session.id, type: 'access' },
          { expiresIn: 300 },
        ),
      };
    }
    try {
      const sender = await createPeer();
      const recipient = await createPeer();
      const response = await request.post('/api/v1/private-conversations', {
        headers: { authorization: `Bearer ${sender.token}` },
        data: { user_a_id: sender.id, user_b_id: recipient.id },
      });
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const id: string = body.data.conversation_id;
      conversationId = id;
      await use({
        senderToken: sender.token,
        senderId: sender.id,
        recipientToken: recipient.token,
        recipientId: recipient.id,
        conversationId: id,
        db,
      });
    } finally {
      if (conversationId)
        await db.conversation.delete({ where: { id: conversationId } });
      if (userIds.length)
        await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.$disconnect();
    }
  },
});

async function connectRecipient(page: Page, token: string) {
  await page.goto('/api/v1/health');
  await page.evaluate(
    (ticket) =>
      new Promise<void>((resolve, reject) => {
        window.realtimeEvents = [];
        const url = new URL(
          '/socket.io/?EIO=4&transport=websocket',
          window.location.origin,
        );
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(url);
        const timer = setTimeout(
          () => reject(new Error('Socket connection timed out')),
          10000,
        );
        socket.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Socket connection failed'));
        };
        socket.onmessage = ({ data }: MessageEvent<string>) => {
          if (data.startsWith('0'))
            socket.send(`40${JSON.stringify({ token: ticket })}`);
          else if (data === '2') socket.send('3');
          else if (data.startsWith('40')) {
            clearTimeout(timer);
            resolve();
          } else if (data.startsWith('44')) {
            clearTimeout(timer);
            reject(new Error(data));
          } else if (data.startsWith('42'))
            window.realtimeEvents.push(JSON.parse(data.slice(2)));
        };
      }),
    token,
  );
}

test('presence follows authenticated sockets across tabs and respects contacts and blocks', async ({
  request,
  page,
  peers,
}) => {
  const headers = { authorization: `Bearer ${peers.senderToken}` };
  const recipientHeaders = { authorization: `Bearer ${peers.recipientToken}` };
  async function presence() {
    const response = await request.get(
      `/api/v1/conversations/${peers.conversationId}`,
      { headers },
    );
    expect(response.ok()).toBeTruthy();
    return (await response.json()).data.members.find(
      (member: { user_id: string }) => member.user_id === peers.recipientId,
    ).user.presence;
  }
  // Contacts-only is the default, and visibility follows the subject's contact list.
  expect(await presence()).toBeNull();
  await peers.db.contact.create({
    data: { user_id: peers.recipientId, contact_user_id: peers.senderId },
  });
  expect(await presence()).toBe('offline');
  await connectRecipient(page, peers.senderToken);
  const firstTab = await page.context().newPage();
  const secondTab = await page.context().newPage();
  try {
    await connectRecipient(firstTab, peers.recipientToken);
    await expect.poll(presence).toBe('online');
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.realtimeEvents.some(([name]) => name === 'presence:updated'),
        ),
      )
      .toBe(true);
    await connectRecipient(secondTab, peers.recipientToken);
    await firstTab.close();
    expect(await presence()).toBe('online');
    await secondTab.close();
    await expect.poll(presence).toBe('offline');

    expect(
      (
        await request.patch('/api/v1/user-settings', {
          headers: recipientHeaders,
          data: { online_visibility: 'nobody' },
        })
      ).ok(),
    ).toBeTruthy();
    expect(await presence()).toBeNull();
    expect(
      (
        await request.patch('/api/v1/user-settings', {
          headers: recipientHeaders,
          data: { online_visibility: 'everyone' },
        })
      ).ok(),
    ).toBeTruthy();
    expect(await presence()).toBe('offline');
    for (const block of [
      { user_id: peers.senderId, blocked_user_id: peers.recipientId },
      { user_id: peers.recipientId, blocked_user_id: peers.senderId },
    ]) {
      await peers.db.blockedUser.create({ data: block });
      expect(await presence()).toBeNull();
      await peers.db.blockedUser.delete({
        where: { user_id_blocked_user_id: block },
      });
    }
  } finally {
    if (!firstTab.isClosed()) await firstTab.close();
    if (!secondTab.isClosed()) await secondTab.close();
  }
});

test('unread counts exclude inactive and own messages and clear without sharing read receipts', async ({
  request,
  peers,
}) => {
  const headers = { authorization: `Bearer ${peers.recipientToken}` };
  const senderHeaders = { authorization: `Bearer ${peers.senderToken}` };
  expect(
    (
      await request.patch('/api/v1/user-settings', {
        headers,
        data: { read_receipts: false },
      })
    ).ok(),
  ).toBeTruthy();
  const ids: string[] = [];
  for (const content of ['First unread', 'Second unread']) {
    const sent = await request.post('/api/v1/messages', {
      headers: senderHeaders,
      data: { conversation_id: peers.conversationId, type: 'text', content },
    });
    expect(sent.ok()).toBeTruthy();
    ids.push((await sent.json()).data.id);
  }
  const firstId = ids[0];
  const secondId = ids[1];
  await peers.db.message.updateMany({
    where: { id: { in: ids } },
    data: { created_at: new Date() },
  });
  await peers.db.message.createMany({
    data: [
      {
        conversation_id: peers.conversationId,
        sender_id: peers.recipientId,
        type: 'text',
        content: 'Own message',
      },
      {
        conversation_id: peers.conversationId,
        sender_id: peers.senderId,
        type: 'text',
        content: 'Deleted',
        deleted_at: new Date(),
      },
      {
        conversation_id: peers.conversationId,
        sender_id: peers.senderId,
        type: 'text',
        content: 'Expired',
        expires_at: new Date(Date.now() - 1000),
      },
      {
        conversation_id: peers.conversationId,
        sender_id: peers.senderId,
        type: 'text',
        content: 'Before joining',
        created_at: new Date('2000-01-01'),
      },
    ],
  });
  async function count() {
    const response = await request.get('/api/v1/conversations', { headers });
    expect(response.ok()).toBeTruthy();
    return (await response.json()).data.data.find(
      (conversation: { id: string }) =>
        conversation.id === peers.conversationId,
    ).unread_count;
  }
  const olderId = firstId < secondId ? firstId : secondId;
  const newerId = firstId < secondId ? secondId : firstId;
  expect(await count()).toBe(2);
  expect(
    (
      await request.patch(`/api/v1/message-receipts/${olderId}/read`, {
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect(await count()).toBe(1);
  expect(
    (
      await request.patch(`/api/v1/message-receipts/${newerId}/read`, {
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect(await count()).toBe(0);
  expect(
    (
      await request.patch(`/api/v1/message-receipts/${olderId}/read`, {
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect(await count()).toBe(0);
  const receipt = await peers.db.messageReceipt.findUniqueOrThrow({
    where: {
      message_id_user_id: { message_id: newerId, user_id: peers.recipientId },
    },
  });
  expect(receipt.read_at).toBeNull();
});

test('a recipient outside the chat gets messages, notifications, attachments and receipt events', async ({
  request,
  page,
  peers,
}) => {
  const senderHeaders = { authorization: `Bearer ${peers.senderToken}` };
  const recipientHeaders = { authorization: `Bearer ${peers.recipientToken}` };
  const session = await request.post('/api/v1/realtime/session', {
    headers: recipientHeaders,
  });
  expect(session.ok()).toBeTruthy();
  const ticket: string = (await session.json()).data.token;
  expect(
    (
      await request.get('/api/v1/users/me', {
        headers: { authorization: `Bearer ${ticket}` },
      })
    ).status(),
  ).toBe(401);
  await connectRecipient(page, ticket);
  const senderPage = await page.context().newPage();
  const senderSession = await request.post('/api/v1/realtime/session', {
    headers: senderHeaders,
  });
  expect(senderSession.ok()).toBeTruthy();
  await connectRecipient(senderPage, (await senderSession.json()).data.token);

  const sent = await request.post('/api/v1/messages', {
    headers: senderHeaders,
    data: {
      conversation_id: peers.conversationId,
      type: 'text',
      content: 'Live delivery',
    },
  });
  expect(sent.ok()).toBeTruthy();
  const messageId: string = (await sent.json()).data.id;
  for (const event of ['message:created', 'message:notification']) {
    await expect
      .poll(() =>
        page.evaluate(
          ({ name, id }) =>
            window.realtimeEvents.some(
              ([eventName, payload]) => eventName === name && payload.id === id,
            ),
          { name: event, id: messageId },
        ),
      )
      .toBe(true);
  }
  const delivered = await request.post(
    `/api/v1/message-receipts/${messageId}/delivered`,
    {
      headers: recipientHeaders,
    },
  );
  expect(delivered.ok()).toBeTruthy();
  const read = await request.patch(
    `/api/v1/message-receipts/${messageId}/read`,
    { headers: recipientHeaders },
  );
  expect(read.ok()).toBeTruthy();
  await expect
    .poll(() =>
      senderPage.evaluate(
        (id) =>
          window.realtimeEvents.some(
            ([event, payload]) =>
              event === 'message:receipt' && payload.message_id === id,
          ),
        messageId,
      ),
    )
    .toBe(true);
  const receipts = await request.get(
    `/api/v1/message-receipts?conversationId=${peers.conversationId}`,
    {
      headers: senderHeaders,
    },
  );
  expect((await receipts.json()).data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message_id: messageId,
        user_id: peers.recipientId,
        delivered_at: expect.any(String),
        read_at: expect.any(String),
      }),
    ]),
  );
  const newer = await request.post('/api/v1/messages', {
    headers: senderHeaders,
    data: {
      conversation_id: peers.conversationId,
      type: 'text',
      content: 'Newer message',
    },
  });
  expect(newer.ok()).toBeTruthy();
  const newerId: string = (await newer.json()).data.id;
  expect(
    (
      await request.patch(`/api/v1/message-receipts/${newerId}/read`, {
        headers: recipientHeaders,
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.patch(`/api/v1/message-receipts/${messageId}/read`, {
        headers: recipientHeaders,
      })
    ).ok(),
  ).toBeTruthy();
  const membership = await peers.db.conversationMember.findUniqueOrThrow({
    where: {
      conversation_id_user_id: {
        conversation_id: peers.conversationId,
        user_id: peers.recipientId,
      },
    },
  });
  expect(membership.last_read_message_id).toBe(newerId);

  const upload = await request.post(
    `/api/v1/message-attachments/upload/${messageId}`,
    {
      headers: senderHeaders,
      multipart: {
        file: {
          name: 'realtime.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Realtime attachment'),
        },
      },
    },
  );
  expect(upload.ok()).toBeTruthy();
  const attachmentId: string = (await upload.json()).data.id;
  try {
    await expect
      .poll(() =>
        page.evaluate(
          (id) =>
            window.realtimeEvents.some(
              ([event, payload]) =>
                event === 'message:attachment' && payload.message_id === id,
            ),
          messageId,
        ),
      )
      .toBe(true);
  } finally {
    expect(
      (
        await request.delete(`/api/v1/message-attachments/${attachmentId}`, {
          headers: senderHeaders,
        })
      ).ok(),
    ).toBeTruthy();
  }
});

for (const preference of [
  'account',
  'muted',
  'none',
  'mentions_only',
] as const) {
  test(`${preference} notification preference does not prevent delivery or override read-receipt opt-out`, async ({
    request,
    page,
    peers,
  }) => {
    const headers = { authorization: `Bearer ${peers.recipientToken}` };
    expect(
      (
        await request.patch('/api/v1/user-settings', {
          headers,
          data: {
            notification_enabled: preference !== 'account',
            read_receipts: false,
          },
        })
      ).ok(),
    ).toBeTruthy();
    if (preference !== 'account') {
      await peers.db.conversationMember.update({
        where: {
          conversation_id_user_id: {
            conversation_id: peers.conversationId,
            user_id: peers.recipientId,
          },
        },
        data:
          preference === 'muted'
            ? { muted_until: new Date(Date.now() + 60_000) }
            : { notification_policy: preference },
      });
    }
    const session = await request.post('/api/v1/realtime/session', { headers });
    expect(session.ok()).toBeTruthy();
    await connectRecipient(page, (await session.json()).data.token);
    const sent = await request.post('/api/v1/messages', {
      headers: { authorization: `Bearer ${peers.senderToken}` },
      data: {
        conversation_id: peers.conversationId,
        type: 'text',
        content: 'Quiet delivery',
      },
    });
    expect(sent.ok()).toBeTruthy();
    const messageId: string = (await sent.json()).data.id;
    await expect
      .poll(() =>
        page.evaluate(
          (id) =>
            window.realtimeEvents.some(
              ([event, payload]) =>
                event === 'message:created' && payload.id === id,
            ),
          messageId,
        ),
      )
      .toBe(true);
    expect(
      (
        await request.patch(`/api/v1/message-receipts/${messageId}/read`, {
          headers,
        })
      ).ok(),
    ).toBeTruthy();
    const receipt = await peers.db.messageReceipt.findUniqueOrThrow({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: peers.recipientId,
        },
      },
    });
    expect(receipt.delivered_at).not.toBeNull();
    expect(receipt.read_at).toBeNull();
    await expect
      .poll(() =>
        page.evaluate(
          (id) =>
            window.realtimeEvents.some(
              ([event, payload]) =>
                event === 'message:receipt' && payload.message_id === id,
            ),
          messageId,
        ),
      )
      .toBe(true);
    expect(
      await page.evaluate(() =>
        window.realtimeEvents.some(
          ([event]) => event === 'message:notification',
        ),
      ),
    ).toBe(false);
  });
}
