export function messageKey(message: string): string {
  let hash = 2166136261;
  for (let index = 0; index < message.length; index++) {
    hash = Math.imul(hash ^ message.charCodeAt(index), 16777619);
  }
  const label = message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
  return `${label}_${(hash >>> 0).toString(16)}`;
}
