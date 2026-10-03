// src/components/ai/AssistantChat.tsx
"use client";

import { useState } from "react";
import { PaperPlaneRight, Sparkle, Plus, ChatsCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useChatStream } from "@/components/ai/useChatStream";
import { AiUpsellModal } from "@/components/ai/AiUpsellModal";
import { ChatMessages } from "@/components/ai/ChatMessages";

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
  const {
    messages,
    setMessages,
    loading,
    notice,
    showUpsell,
    setShowUpsell,
    conversationId,
    setConversationId,
    send,
  } = useChatStream();

  const [convList, setConvList] = useState<Conversation[]>(conversations);
  const [scopeType, setScopeType] = useState<"all" | "course">("all");
  const [courseId, setCourseId] = useState<string>("");
  const [input, setInput] = useState("");

  const missingCourse = scopeType === "course" && !courseId;

  function newChat() {
    setConversationId("");
    setMessages([]);
    setInput("");
  }

  async function openConversation(id: string) {
    if (id === conversationId) return;
    const { data } = await supabase
      .from("ai_messages")
      .select("role,content,sources,provider")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(
      (data ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        sources: (m.sources as { noteId: string; snippet?: string }[] | null) ?? undefined,
        provider: (m.provider as { provider: string; model: string } | null) ?? undefined,
      })),
    );
    setConversationId(id);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingCourse) return;
    const msg = input;
    setInput("");
    send(msg, { type: scopeType, courseId }, (id, title) =>
      setConvList((list) => [{ id, title, created_at: new Date().toISOString() }, ...list]),
    );
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
            <h1 className="font-heading text-2xl font-bold text-foreground">Çalışma Arkadaşı</h1>
            <p className="text-sm text-muted">Platformdaki notlara dayanarak sorularını yanıtlar.</p>
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

        <ChatMessages
          messages={messages}
          loading={loading}
          bubbleClassName="bg-background"
          className="h-[60vh] min-h-[320px] rounded-2xl border border-border bg-card p-4"
          empty={
            <p className="py-10 text-center text-sm text-muted">
              Bir soru sorarak başla. Örn: &quot;Veri Yapıları&apos;nda ağaçlar nasıl çalışır?&quot;
            </p>
          }
        />

        {missingCourse && <p className="text-center text-xs text-muted">Önce bir ders seç.</p>}
        {notice && <p className="text-center text-xs text-muted">{notice}</p>}

        <form onSubmit={onSubmit} className="flex gap-2">
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

      {showUpsell && <AiUpsellModal onClose={() => setShowUpsell(false)} />}
    </div>
  );
}
