import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { useUiText } from '@/i18n/ui-text';

export function FeatureNotice({
  title,
  description,
  detail,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  detail: string;
  href?: string;
  linkLabel?: string;
}) {
  const text = useUiText();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{text(title)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text(description)}</p>
      </header>
      <Card>
        <CardContent className="py-6">
          <p className="text-sm leading-6 text-muted-foreground">{text(detail)}</p>
          {href && linkLabel && (
            <Link
              className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={href}
            >
              {text(linkLabel)}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
