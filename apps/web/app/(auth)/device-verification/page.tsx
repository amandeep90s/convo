import { FeatureNotice } from '@/components/app/feature-notice';

export default function DeviceVerificationPage() {
  return (
    <main className="px-4 py-10">
      <FeatureNotice
        description="A separate device-verification flow is not available in this web client."
        detail="New web sessions are protected by the existing sign-in flow and device sessions can be reviewed or revoked in Settings. No verification action has been performed."
        href="/login"
        linkLabel="Return to sign in"
        title="Device verification"
      />
    </main>
  );
}
