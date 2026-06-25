import { AnimatePresence } from "framer-motion";
import { MessageRow } from "./MessageRow";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "./EmptyState";
import type { ChatMessage } from "@/hooks/chat_store";

interface MessageListProps {
  messages: ChatMessage[];
  pending: boolean;
  isEmpty: boolean;
  onEmptyStatePick: (question: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  pending,
  isEmpty,
  onEmptyStatePick,
  scrollRef,
}: MessageListProps) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {isEmpty ? (
          <EmptyState onPick={onEmptyStatePick} />
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageRow key={m.id} message={m} />
              ))}
            </AnimatePresence>
            {pending && <TypingIndicator />}
          </div>
        )}
      </div>
    </div>
  );
}
