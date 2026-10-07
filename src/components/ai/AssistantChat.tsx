// src/components/ai/AssistantChat.tsx
"use client";

import { Combobox } from "@/components/ui/Combobox";
import { useState, useEffect } from "react";
import { PaperPlaneRight, Sparkle, Plus, ChatsCircle, CheckSquare, Square, Buildings, CircleNotch } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useChatStream } from "@/components/ai/useChatStream";
import { AiUpsellModal } from "@/components/ai/AiUpsellModal";
import { ChatMessages } from "@/components/ai/ChatMessages";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

export interface CourseGroup {
  name: string;
  entries: { courseId: string; university: string }[];
}

interface Source {
  id: string;
  title: string;
  university: string;
  aiIndexed: boolean | null;
}

export function AssistantChat({
  courseGroups,
  conversations,
}: {
  courseGroups: CourseGroup[];
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
  const [selectedName, setSelectedName] = useState<string>("");
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");

  const group = courseGroups.find((g) => g.name === selectedName);

  // Ders adı seçilince o derse ait notları (tüm üniversitelerden) getir
  useEffect(() => {
    if (scopeType !== "course" || !group) {
      setSources([]);
      setSelectedNotes(new Set());
      return;
    }
    let cancelled = false;
    setSourcesLoading(true);
    const uniByCourse = new Map(group.entries.map((e) => [e.courseId, e.university]));
    const courseIds = group.entries.map((e) => e.courseId);
    (async () => {
      const { data } = await supabase
        .from("notes")
        .select("id,title,course_id,ai_indexed")
        .in("course_id", courseIds);
      if (cancelled) return;
      const list: Source[] = (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        university: uniByCourse.get(n.course_id) ?? "—",
        aiIndexed: n.ai_indexed,
      }));
      setSources(list);
      setSelectedNotes(new Set(list.filter((s) => s.aiIndexed).map((s) => s.id)));
      setSourcesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [scopeType, selectedName, group, supabase]);

  const usableCount = sources.filter((s) => s.aiIndexed).length;
  const canSend =
    !loading && (scopeType === "all" || (scopeType === "course" && selectedNotes.size > 0));

  function toggleNote(id: string) {
    setSelectedNotes((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

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
    if (!canSend) return;
    const msg = input;
    setInput("");
    // Belirli ders: üniversiteler arası seçili notlarla (noteIds) sınırla
    const scope =
      scopeType === "course"
        ? { type: "all" as const, noteIds: [...selectedNotes] }
        : { type: "all" as const };
    send(msg, scope, (id, title) =>
      setConvList((list) => [{ id, title, created_at: new Date().toISOString() }, ...list]),
    );
  }

  // Aynı üniversiteden birden çok not olabilir; kaynak listesini üniversiteye göre grupla
  const byUniversity = sources.reduce<Record<string, Source[]>>((acc, s) => {
    (acc[s.university] ??= []).push(s);
    return acc;
  }, {});

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
          {convList.length === 0 && <p className="px-2 py-4 text-xs text-muted">Henüz sohbet yok.</p>}
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

        <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
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
              <div className="w-full sm:w-72">
                <Combobox
                  placeholder="Ders seç..."
                  searchPlaceholder="Ders ara..."
                  options={courseGroups.map((g) => ({ value: g.name, label: g.name }))}
                  value={selectedName}
                  onChange={setSelectedName}
                />
              </div>
            )}
          </div>

          {/* Kaynaklar: seçilen dersin notları, üniversiteye göre */}
          {scopeType === "course" && selectedName && (
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Kaynaklar
                </span>
                {usableCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedNotes(
                        selectedNotes.size === usableCount
                          ? new Set()
                          : new Set(sources.filter((s) => s.aiIndexed).map((s) => s.id)),
                      )
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedNotes.size === usableCount ? "Hiçbiri" : "Tümü"}
                  </button>
                )}
              </div>

              {sourcesLoading ? (
                <p className="flex items-center gap-1.5 py-2 text-xs text-muted">
                  <CircleNotch size={13} className="animate-spin" /> Kaynaklar yükleniyor...
                </p>
              ) : sources.length === 0 ? (
                <p className="py-2 text-xs text-muted">Bu ders için not bulunamadı.</p>
              ) : (
                <div className="max-h-52 space-y-3 overflow-y-auto">
                  {Object.entries(byUniversity).map(([uni, list]) => (
                    <div key={uni}>
                      <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted">
                        <Buildings size={12} /> {uni}
                      </p>
                      <div className="space-y-0.5">
                        {list.map((s) => {
                          const on = selectedNotes.has(s.id);
                          const disabled = !s.aiIndexed;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleNote(s.id)}
                              title={disabled ? "Henüz işlenmedi / metin yok" : s.title}
                              className={
                                "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm " +
                                (disabled ? "cursor-not-allowed opacity-50" : on ? "bg-primary/10" : "hover:bg-foreground/5")
                              }
                            >
                              {on && !disabled ? (
                                <CheckSquare size={16} weight="fill" className="mt-0.5 shrink-0 text-primary" />
                              ) : (
                                <Square size={16} className="mt-0.5 shrink-0 text-muted" />
                              )}
                              <span className="line-clamp-1 text-foreground">{s.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <ChatMessages
          messages={messages}
          loading={loading}
          bubbleClassName="bg-background"
          className="h-[55vh] min-h-[300px] rounded-2xl border border-border bg-card p-4"
          empty={
            <p className="py-10 text-center text-sm text-muted">
              Bir soru sorarak başla. Örn: &quot;Ağaç veri yapısı nasıl çalışır?&quot;
            </p>
          }
        />

        {scopeType === "course" && selectedName && selectedNotes.size === 0 && !sourcesLoading && (
          <p className="text-center text-xs text-muted">En az bir kaynak seç.</p>
        )}
        {scopeType === "course" && !selectedName && (
          <p className="text-center text-xs text-muted">Önce bir ders seç.</p>
        )}
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
            disabled={!canSend}
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
