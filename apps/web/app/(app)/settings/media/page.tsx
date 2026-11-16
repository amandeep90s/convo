import { FeatureNotice } from '@/components/app/feature-notice';

export default function MediaPage() {
  return (
    <FeatureNotice
      description="Share supported files from within a conversation."
      detail="The server currently enforces the supported file types and upload size. This web interface does not yet include upload controls or per-account media preferences."
      href="/chat"
      linkLabel="Open conversations"
      title="Media"
    />
  );
}
