import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/40 px-8 text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircle aria-hidden="true" className="size-12" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Your conversations, all in one place</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Select a chat to continue a conversation, or start a new one with your contacts.
      </p>
    </div>
  );
}
