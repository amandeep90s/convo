export function isUsernameMentioned(content: string, username: string): boolean {
  const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_.@])@${escaped}(?=$|[^\\p{L}\\p{N}_.]|\\.(?:\\s|$))`, 'iu').test(content);
}
