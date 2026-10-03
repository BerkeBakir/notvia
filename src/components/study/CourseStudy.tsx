// src/components/study/CourseStudy.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Cards,
  ChatsCircle,
  CheckSquare,
  Exam,
  FileText,
  Lightning,
  ListChecks,
  PaperPlaneRight,
  Question,
  Sparkle,
  Square,
  TextAlignLeft,
} from "@phosphor-icons/react";
import { useChatStream } from "@/components/ai/useChatStream";
import { ChatMessages } from "@/components/ai/ChatMessages";
import { AiUpsellModal } from "@/components/ai/AiUpsellModal";
import { AiPanel } from "@/components/ai/AiPanel";
import { Markdown } from "@/components/ai/Markdown";
import { QuizView } from "@/components/study/QuizView";
import { FlashcardView } from "@/components/study/FlashcardView";
import type { StudioKind, StudioResult } from "@/lib/ai/studio";

export interface StudySource {
  id: string;
  title: string;
  type: "note" | "exam";
  /** null = henüz işlenmedi, false = metin çıkarılamadı */
  aiIndexed: boolean | null;
}

const STUDIO: { kind: StudioKind; label: string; desc: string; Icon: typeof BookOpen }[] = [
  { kind: "quiz", label: "Quiz", desc: "Şıklı sorular, anında puan", Icon: Exam },
  { kind: "flashcards", label: "Bilgi kartları", desc: "Çevir, biliyorum / tekrar", Icon: Cards },
  { kind: "guide", label: "Çalışma rehberi", desc: "Hedefler, konular, çalışma sırası", Icon: ListChecks },
  { kind: "summary", label: "Özet", desc: "Ana konular ve tanımlar", Icon: TextAlignLeft },
  { kind: "faq", label: "SSS", desc: "Sık sorulan sorular", Icon: Question },
];

const SUGGESTIONS = [
  "Bu notlardaki ana konular neler?",
  "En zor konuyu basitçe anlat",
  "Sınavda neler çıkabilir?",
];

interface Output {
  id: number;
  label: string;
  sourceCount: number;
  result: StudioResult;
  provider?: string;
}

type Tab = "sources" | "chat" | "studio";

/** NotebookLM tarzı ders çalışma alanı: Kaynaklar · Sohbet · Stüdyo. */
export function CourseStudy({
  courseId,
  courseName,
  sources,
  loggedIn,
}: {
  courseId: string;
  courseName: string;
  sources: StudySource[];
  loggedIn: boolean;
}) {
  const usable = useMemo(() => sources.filter((s) => s.aiIndexed), [sources]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(usable.map((s) => s.id)));
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const { messages, loading, notice, setNotice, showUpsell, setShowUpsell, send } = useChatStream();

  const [busyKind, setBusyKind] = useState<StudioKind | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [studioError, setStudioError] = useState("");

  const titles = useMemo(() => Object.fromEntries(sources.map((s) => [s.id, s.title])), [sources]);
  const noteIds = [...selected];
  const noSelection = noteIds.length === 0;
  const opened = outputs.find((o) => o.id === openId) ?? null;

  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Sparkle size={28} weight="duotone" className="mx-auto text-primary" />
        <h2 className="mt-2 font-heading text-lg font-bold text-foreground">Bu derse AI ile çalış</h2>
        <p className="mt-1 text-sm text-muted">
          Notları kaynak seç, sorularını sor; quiz, bilgi kartı ve çalışma rehberi üret.
        </p>
        <Link
          href={`/login?next=/courses/${courseId}`}
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function ask(text: string) {
    if (noSelection) {
      setNotice("Önce en az bir kaynak seç.");
      return;
    }
    send(text, { type: "course", courseId, noteIds });
    setTab("chat");
  }

  async function generate(kind: StudioKind, label: string) {
    if (noSelection) {
      setStudioError("Önce en az bir kaynak seç.");
      return;
    }
    setBusyKind(kind);
    setStudioError("");
    try {
      const res = await fetch("/api/ai/studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, noteIds, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 || data.limitReached) setShowUpsell(true);
        else setStudioError(data.error ?? "Üretilemedi.");
      } else {
        const out: Output = {
          id: Date.now(),
          label,
          sourceCount: noteIds.length,
          result: data.result,
          provider: data.provider,
        };
        setOutputs((o) => [out, ...o]);
        setOpenId(out.id);
      }
    } catch {
      setStudioError("Bağlantı hatası.");
    }
    setBusyKind(null);
  }

  const sourcesPanel = (
    <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-bold text-card-foreground">Kaynaklar</h3>
        {usable.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setSelected(selected.size === usable.length ? new Set() : new Set(usable.map((s) => s.id)))
            }
            className="text-xs text-primary hover:underline"
          >
            {selected.size === usable.length ? "Hiçbiri" : "Tümü"}
          </button>
        )}
      </header>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {sources.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted">Bu derste henüz not yok.</p>}
        {sources.map((s) => {
          const on = selected.has(s.id);
          const disabled = !s.aiIndexed;
          return (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(s.id)}
              title={disabled ? (s.aiIndexed === false ? "Metin çıkarılamadı (taranmış PDF)" : "Henüz işlenmedi") : s.title}
              className={
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition " +
                (disabled ? "cursor-not-allowed opacity-50" : on ? "bg-primary/10" : "hover:bg-foreground/5")
              }
            >
              {on && !disabled ? (
                <CheckSquare size={18} weight="fill" className="mt-0.5 shrink-0 text-primary" />
              ) : (
                <Square size={18} className="mt-0.5 shrink-0 text-muted" />
              )}
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-foreground">{s.title}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                  <FileText size={11} />
                  {s.type === "exam" ? "Sınav" : "Ders notu"}
                  {disabled && <span>· {s.aiIndexed === false ? "metin yok" : "işleniyor"}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted">
        {selected.size}/{usable.length} kaynak seçili
      </p>
    </section>
  );

  const chatPanel = (
    <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card">
      <ChatMessages
        messages={messages}
        loading={loading}
        noteTitles={titles}
        className="min-h-0 flex-1 p-4"
        bubbleClassName="bg-background"
        empty={
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <ChatsCircle size={32} weight="duotone" className="text-primary" />
            <p className="mt-2 font-heading font-bold text-foreground">Seçili notlarla sohbet et</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Cevaplar yalnızca seçtiğin kaynaklardan gelir; numaralara gelerek ilgili pasajı görebilirsin.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading || noSelection}
                  onClick={() => ask(q)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        }
      />
      {notice && <p className="px-4 pb-1 text-center text-xs text-muted">{notice}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          const msg = input;
          setInput("");
          ask(msg);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={noSelection ? "Önce kaynak seç..." : `${selected.size} kaynağa soru sor...`}
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || noSelection}
          aria-label="Gönder"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>
    </section>
  );

  const studioPanel = (
    <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-bold text-card-foreground">Stüdyo</h3>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {STUDIO.map(({ kind, label, desc, Icon }) => (
            <button
              key={kind}
              type="button"
              disabled={busyKind !== null || noSelection}
              onClick={() => generate(kind, label)}
              className="flex items-start gap-2.5 rounded-xl border border-border p-3 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              <Icon size={20} weight="duotone" className="mt-0.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {busyKind === kind ? "Hazırlanıyor..." : label}
                </span>
                <span className="block text-[11px] leading-snug text-muted">{desc}</span>
              </span>
            </button>
          ))}
        </div>
        {busyKind && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Lightning size={14} className="animate-pulse text-primary" /> Notlar okunuyor, 10-40 sn sürebilir...
          </p>
        )}
        {studioError && <p className="mt-3 text-xs text-red-400">{studioError}</p>}

        {outputs.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Oluşturulanlar</p>
            <div className="space-y-1.5">
              {outputs.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOpenId(o.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-xs hover:border-primary"
                >
                  <span className="font-medium text-foreground">{o.label}</span>
                  <span className="text-muted">
                    {new Date(o.id).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "sources", label: `Kaynaklar (${selected.size})` },
    { id: "chat", label: "Sohbet" },
    { id: "studio", label: "Stüdyo" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkle size={22} weight="duotone" className="text-primary" />
        <h2 className="font-heading text-lg font-bold text-foreground">Bu derse çalış</h2>
      </div>

      {/* Mobil: sekmeler */}
      <div className="flex gap-1 rounded-full border border-border bg-card p-1 lg:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium " +
              (tab === t.id ? "bg-primary text-primary-foreground" : "text-muted")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid h-[600px] grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
        <div className={`min-h-0 ${tab === "sources" ? "grid" : "hidden"} lg:grid`}>{sourcesPanel}</div>
        <div className={`min-h-0 ${tab === "chat" ? "grid" : "hidden"} lg:grid`}>{chatPanel}</div>
        <div className={`min-h-0 ${tab === "studio" ? "grid" : "hidden"} lg:grid`}>{studioPanel}</div>
      </div>

      {opened && (
        <AiPanel
          title={opened.label}
          subtitle={`${courseName} · ${opened.sourceCount} kaynak`}
          onClose={() => setOpenId(null)}
          footer={<p className="text-[11px] text-muted">AI hata yapabilir; önemli bilgileri notlardan doğrula.</p>}
        >
          {opened.result.kind === "quiz" ? (
            <QuizView key={opened.id} questions={opened.result.questions} />
          ) : opened.result.kind === "flashcards" ? (
            <FlashcardView key={opened.id} cards={opened.result.cards} />
          ) : (
            <Markdown text={opened.result.markdown} />
          )}
        </AiPanel>
      )}

      {showUpsell && <AiUpsellModal onClose={() => setShowUpsell(false)} />}
    </div>
  );
}
