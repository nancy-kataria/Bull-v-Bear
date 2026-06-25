import { motion } from "framer-motion";
import { Bot, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/hooks/chat_store";

interface MessageRowProps {
  message: ChatMessage;
}

export function MessageRow({ message }: MessageRowProps) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={["flex gap-3", isUser ? "flex-row-reverse" : ""].join(" ")}
    >
      <div
        className={[
          "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1",
          isUser
            ? "bg-system/20 text-system ring-system/40"
            : "bg-judge/15 text-judge ring-judge/40",
        ].join(" ")}
      >
        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={["max-w-[80%]", isUser ? "text-right" : ""].join(" ")}>
        {isUser ? (
          <div className="inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-left text-sm leading-relaxed text-primary-foreground">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed text-foreground/95">
            <ReactMarkdown
              components={{
                h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
