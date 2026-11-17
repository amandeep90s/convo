import { useUiText } from '@/i18n/ui-text';
export default function Footer() {
  const text = useUiText();
  return (
    <footer className="border-t px-6 py-5 text-center text-sm text-muted-foreground">
      <p>{text('Convo — private, connected conversations.')}</p>
    </footer>
  );
}
