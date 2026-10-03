// src/components/ai/ChatMessages.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { LinkSimple } from "@phosphor-icons/react";
import { Markdown } from "@/components/ai/Markdown";
import type { ChatMsg } from "@/components/ai/useChatStream";

const PROVIDER_LABEL: Record<string, string> = {
  gemini: "Gemini",
  groq: "Groq",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
  mistral: "Mistral",
};

/**
 * Sohbet mesaj listesi (tam sayfa + ders asistanı ortak).
 * Yanıt akarken alta yapışık kalır; kullanıcı yukarı kaydırdıysa onu zorla aşağı çekmez.
 */
export function ChatMessages({
  messages,
  loading,
  className,
  bubbleClassName = "bg-card",
  empty,
}: {
  messages: ChatMsg[];
  loading: boolean;
  className: string;
  bubbleClassName?: string;
  empty?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastLen = useRef(messages.length);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Yeni mesaj gönderildiğinde her zaman alta in
    if (messages.length > lastLen.current) stick.current = true;
    lastLen.current = messages.length;
    if (stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const last = messages[messages.length - 1];
  const waiting = loading && (!last || last.role === "user" || !last.content);

  return (
    <div
      ref={ref}
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      }}
      className={`space-y-4 overflow-y-auto ${className}`}
    >
      {messages.length === 0 && empty}
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          {m.role === "user" ? (
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ) : (
            <div
              className={`max-w-[92%] rounded-2xl rounded-tl-sm border border-border px-4 py-3 text-sm text-foreground ${bubbleClassName}`}
            >
              <Markdown text={m.content} />
              {((m.sources && m.sources.length > 0) || m.provider) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
                  {m.sources?.map((s, j) => (
                    <Link
                      key={s.noteId}
                      href={`/notes/${s.noteId}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <LinkSimple size={12} /> Kaynak {j + 1}
                    </Link>
                  ))}
                  {m.provider && (
                    <span className="ml-auto text-[11px] text-muted" title={m.provider.model}>
                      {PROVIDER_LABEL[m.provider.provider] ?? m.provider.provider} · {m.provider.model}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {waiting && <p className="animate-pulse text-sm text-muted">Düşünüyor...</p>}
    </div>
  );
}
