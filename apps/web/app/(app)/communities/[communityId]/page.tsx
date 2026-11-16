import { CommunityView } from '@/components/app/community-view';

export default async function CommunityDetailPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  return <CommunityView communityId={communityId} />;
}
