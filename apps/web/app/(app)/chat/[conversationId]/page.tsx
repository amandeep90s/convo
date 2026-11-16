import { ConversationView } from '@/components/app/conversation-view';

export default async function ChatConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return <ConversationView conversationId={conversationId} />;
}
