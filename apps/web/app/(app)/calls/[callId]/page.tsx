import { CallView } from '@/components/app/call-view';

export default async function CallDetailPage({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  return <CallView callId={callId} />;
}
