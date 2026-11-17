import { FeatureNotice } from '@/components/app/feature-notice';
import { useUiText } from '@/i18n/ui-text';

export default function DeviceVerificationPage() {
  const text = useUiText();
  return (
    <main className="px-4 py-10">
      <FeatureNotice
        description={text('A separate device-verification flow is not available in this web client.')}
        detail={text(
          'New web sessions are protected by the existing sign-in flow and device sessions can be reviewed or revoked in Settings. No verification action has been performed.',
        )}
        href="/login"
        linkLabel={text('Return to sign in')}
        title={text('Device verification')}
      />
    </main>
  );
}
