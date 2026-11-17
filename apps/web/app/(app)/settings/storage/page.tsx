import { FeatureNotice } from '@/components/app/feature-notice';
import { useUiText } from '@/i18n/ui-text';

export default function StoragePage() {
  const text = useUiText();
  return (
    <FeatureNotice
      description={text('Attachment storage is managed by the service.')}
      detail={text(
        'The API does not expose a storage quota, usage summary, or bulk cleanup operation. Files remain associated with their messages; use the relevant conversation to review or remove supported attachments.',
      )}
      href="/chat"
      linkLabel={text('Browse conversations')}
      title={text('Storage')}
    />
  );
}
