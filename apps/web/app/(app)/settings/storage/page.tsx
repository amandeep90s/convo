import { FeatureNotice } from '@/components/app/feature-notice';

export default function StoragePage() {
  return (
    <FeatureNotice
      description="Attachment storage is managed by the service."
      detail="The API does not expose a storage quota, usage summary, or bulk cleanup operation. Files remain associated with their messages; use the relevant conversation to review or remove supported attachments."
      href="/chat"
      linkLabel="Browse conversations"
      title="Storage"
    />
  );
}
