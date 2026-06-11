"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useThreads, type ChatMessage } from "@/lib/chat_store";
import { DisclaimerBanner } from "@/components/trading-assistant/DisclaimerBanner";
import { MessageList } from "@/components/trading-assistant/MessageList";
import { MessageComposer } from "@/components/trading-assistant/MessageComposer";

export default function ThreadView() {
  const params = useParams() as { chatId: string };
  const threadId = params.chatId;
  const { threads, ready, appendMessage } = useThreads();
  const thread = useMemo(() => threads.find((t) => t.id === threadId), [threads, threadId]);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [dbChatId, setDbChatId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus textarea on mount + thread change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length, pending]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Conversation not found.
      </div>
    );
  }

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    appendMessage(thread.id, userMsg);
    setPending(true);

    try {
      // Call the real assistant API with chatId for database persistence
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...thread.messages, userMsg], // Send messages as-is; API handles role conversion
          chatId: dbChatId, // Send the current chat ID (or null for new chats)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }

      const data = await response.json();

      // Update the chatId if this was a new conversation
      if (!dbChatId && data.chatId) {
        setDbChatId(data.chatId);
      }

      appendMessage(thread.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Assistant error:", error);
      appendMessage(thread.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again.",
        createdAt: Date.now(),
      });
    } finally {
      setPending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const isEmpty = thread?.messages.length === 0 && !pending;

  return (
    <div className="flex h-full flex-col">
      <DisclaimerBanner />
      <MessageList
        messages={thread.messages}
        pending={pending}
        isEmpty={isEmpty}
        onEmptyStatePick={setInput}
        scrollRef={scrollRef}
      />
      <MessageComposer
        ref={textareaRef}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </div>
  );
}