import { FeatureNotice } from '@/components/app/feature-notice';
import { useUiText } from '@/i18n/ui-text';

export default function MediaPage() {
  const text = useUiText();
  return (
    <FeatureNotice
      description={text('Share supported files from within a conversation.')}
      detail={text(
        'The server currently enforces the supported file types and upload size. This web interface does not yet include upload controls or per-account media preferences.',
      )}
      href="/chat"
      linkLabel={text('Open conversations')}
      title={text('Media')}
    />
  );
}
