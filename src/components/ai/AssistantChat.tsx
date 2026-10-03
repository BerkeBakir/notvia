// src/components/ai/AssistantChat.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PaperPlaneRight, Sparkle, LinkSimple, Plus, ChatsCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: { noteId: string }[];
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

export function AssistantChat({
  courses,
  conversations,
}: {
  courses: { id: string; name: string }[];
  conversations: Conversation[];
}) {
  const supabase = createClient();
  const [convList, setConvList] = useState<Conversation[]>(conversations);
  const [scopeType, setScopeType] = useState<"all" | "course">("all");
  const [courseId, setCourseId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [notice, setNotice] = useState("");

  const missingCourse = scopeType === "course" && !courseId;

  function newChat() {
    setConversationId("");
    setMessages([]);
    setNotice("");
    setInput("");
  }

  async function openConversation(id: string) {
    if (id === conversationId) return;
    setLoading(true);
    setNotice("");
    const { data } = await supabase
      .from("ai_messages")
      .select("role,content,sources")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(
      (data ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        sources: (m.sources as { noteId: string }[] | null) ?? undefined,
      })),
    );
    setConversationId(id);
    setLoading(false);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading || missingCourse) return;
    const isNew = !conversationId;
    setInput("");
    setNotice("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          scopeType,
          scopeCourseId: scopeType === "course" ? courseId : null,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Hata oluştu.");
        setMessages((m) => m.slice(0, -1));
      } else {
        setConversationId(data.conversationId);
        if (isNew) {
          setConvList((list) => [
            { id: data.conversationId, title: message.slice(0, 60), created_at: new Date().toISOString() },
            ...list,
          ]);
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.answer, sources: data.sources },
        ]);
        if (data.remaining !== null && data.remaining !== undefined) {
          setNotice(`Bugün kalan ücretsiz soru: ${data.remaining}`);
        }
      }
    } catch {
      setNotice("Bağlantı hatası.");
      setMessages((m) => m.slice(0, -1));
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row">
      {/* Geçmiş paneli */}
      <aside className="shrink-0 lg:w-64">
        <button
          type="button"
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} weight="bold" /> Yeni sohbet
        </button>
        <div className="mt-3 space-y-1">
          {convList.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted">Henüz sohbet yok.</p>
          )}
          {convList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openConversation(c.id)}
              className={
                "flex w-full items-center gap-2 truncate rounded-lg px-3 py-2 text-left text-sm " +
                (c.id === conversationId
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-card hover:text-foreground")
              }
            >
              <ChatsCircle size={15} className="shrink-0" />
              <span className="truncate">{c.title || "Sohbet"}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Sohbet alanı */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <Sparkle size={28} weight="duotone" className="text-primary" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Çalışma Arkadaşı
            </h1>
            <p className="text-sm text-muted">
              Platformdaki notlara dayanarak sorularını yanıtlar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <button
            type="button"
            onClick={() => setScopeType("all")}
            className={
              scopeType === "all"
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
            }
          >
            Tüm platform
          </button>
          <button
            type="button"
            onClick={() => setScopeType("course")}
            className={
              scopeType === "course"
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
            }
          >
            Belirli ders
          </button>
          {scopeType === "course" && (
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">Ders seç...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="min-h-[300px] space-y-4 rounded-2xl border border-border bg-card p-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              Bir soru sorarak başla. Örn: &quot;Veri Yapıları&apos;nda ağaçlar nasıl çalışır?&quot;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                    : "max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-2 text-sm text-foreground"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">
                    {m.sources.map((s, j) => (
                      <Link
                        key={s.noteId}
                        href={`/notes/${s.noteId}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <LinkSimple size={12} /> Kaynak {j + 1}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <p className="text-sm text-muted">Düşünüyor...</p>}
        </div>

        {missingCourse && (
          <p className="text-center text-xs text-muted">Önce bir ders seç.</p>
        )}
        {notice && <p className="text-center text-xs text-muted">{notice}</p>}

        <form onSubmit={send} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sorunu yaz..."
            className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading || missingCourse}
            aria-label="Gönder"
            className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <PaperPlaneRight size={20} weight="fill" />
          </button>
        </form>
      </div>
    </div>
  );
}
