import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import ts from 'typescript';

import { messageKey } from '../i18n/message-key';
import en from '../messages/en.json';
import hi from '../messages/hi.json';
import pa from '../messages/pa.json';

const root = fileURLToPath(new URL('..', import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) return ['api', 'fonts'].includes(entry.name) ? [] : sourceFiles(full);
    return full.endsWith('.tsx') ? [full] : [];
  });
}

test('all translated UI phrases have matching catalog keys and interpolation parameters', () => {
  const catalogs: Record<string, Record<string, string>> = { en: en.UI, pa: pa.UI, hi: hi.UI };
  const parameters = (message: string) => [...message.matchAll(/\{(\w+)(?:\}|,)/g)].map((match) => match[1]).sort();
  for (const [locale, catalog] of Object.entries(catalogs)) {
    expect(Object.keys(catalog).sort(), locale).toEqual(Object.keys(en.UI).sort());
    for (const [key, source] of Object.entries(en.UI)) {
      expect(catalog[key], `${locale}: ${key}`).toBeTruthy();
      expect(parameters(catalog[key]!), `${locale}: ${key}`).toEqual(parameters(source));
    }
  }
  const files = ['app', 'components/app', 'components/auth', 'components/core'].flatMap((directory) =>
    sourceFiles(join(root, directory)),
  );
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'text') {
        const phrase = node.arguments[0];
        if (phrase && ts.isStringLiteral(phrase)) {
          expect(catalogs.en![messageKey(phrase.text)], `${file}: ${phrase.text}`).toBeDefined();
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
