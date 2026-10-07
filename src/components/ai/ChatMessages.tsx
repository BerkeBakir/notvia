// src/components/ai/ChatMessages.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { LinkSimple } from "@phosphor-icons/react";
import { Markdown } from "@/components/ai/Markdown";
import { SaveAnswerButton } from "@/components/ai/SaveAnswerButton";
import type { ChatMsg } from "@/components/ai/useChatStream";

const PROVIDER_LABEL: Record<string, string> = {
  claude: "Claude",
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
  noteTitles,
}: {
  messages: ChatMsg[];
  loading: boolean;
  className: string;
  bubbleClassName?: string;
  empty?: React.ReactNode;
  /** noteId → başlık; atıf önizlemesinde gösterilir. */
  noteTitles?: Record<string, string>;
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
              <Markdown
                text={m.content}
                cite={(nums, key) => (
                  <Citations key={key} nums={nums} sources={m.sources} noteTitles={noteTitles} />
                )}
              />
              {m.content.trim() && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
                  {uniqueNotes(m.sources).map((noteId, j) => (
                    <Link
                      key={noteId}
                      href={`/notes/${noteId}`}
                      className="inline-flex max-w-[220px] items-center gap-1 truncate text-xs text-primary hover:underline"
                    >
                      <LinkSimple size={12} className="shrink-0" />
                      <span className="truncate">{noteTitles?.[noteId] ?? `Kaynak ${j + 1}`}</span>
                    </Link>
                  ))}
                  <SaveAnswerButton content={m.content} sources={m.sources} />
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

function uniqueNotes(sources: ChatMsg["sources"]): string[] {
  return [...new Set((sources ?? []).map((s) => s.noteId))];
}

/** [1, 3] atfı: küçük numara rozetleri; üzerine gelince/odaklanınca pasaj önizlemesi. */
function Citations({
  nums,
  sources,
  noteTitles,
}: {
  nums: number[];
  sources: ChatMsg["sources"];
  noteTitles?: Record<string, string>;
}) {
  return (
    <span className="whitespace-nowrap">
      {nums.map((n) => {
        const src = sources?.[n - 1];
        if (!src) return <sup key={n} className="text-[10px] text-muted">[{n}]</sup>;
        const title = noteTitles?.[src.noteId];
        return (
          <span key={n} className="group relative mx-0.5 inline-block align-super">
            <Link
              href={`/notes/${src.noteId}`}
              className="grid h-4 min-w-4 place-items-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold leading-none text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {n}
            </Link>
            {(src.snippet || title) && (
              <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-1 w-64 -translate-x-1/2 whitespace-normal rounded-lg border border-border bg-card p-2.5 text-left text-xs font-normal leading-snug text-foreground opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {title && <span className="mb-1 block font-semibold text-primary">{title}</span>}
                {src.snippet && <span className="line-clamp-5 text-muted">{src.snippet}…</span>}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
