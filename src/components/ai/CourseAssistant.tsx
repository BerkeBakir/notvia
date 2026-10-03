// src/components/ai/CourseAssistant.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PaperPlaneRight, Sparkle, ListChecks, Exam, TextAlignLeft } from "@phosphor-icons/react";
import { useChatStream } from "@/components/ai/useChatStream";
import { AiUpsellModal } from "@/components/ai/AiUpsellModal";
import { ChatMessages } from "@/components/ai/ChatMessages";

const QUICK_ACTIONS = [
  { Icon: ListChecks, label: "Çalışma planı", prompt: "Bu dersin notlarına dayanarak sınava hazırlanmam için adım adım bir çalışma planı oluştur. Konuları önem sırasına göre sırala." },
  { Icon: Exam, label: "Beni test et", prompt: "Bu dersin notlarından 5 adet kısa sınav sorusu üret. Soruların hemen altında cevap anahtarını ayrı bir başlıkta ver." },
  { Icon: TextAlignLeft, label: "Özetle", prompt: "Bu dersin notlarındaki ana konuları ve önemli tanımları madde madde özetle." },
];

export function CourseAssistant({
  courseId,
  loggedIn,
}: {
  courseId: string;
  loggedIn: boolean;
}) {
  const { messages, loading, notice, showUpsell, setShowUpsell, send } = useChatStream();
  const [input, setInput] = useState("");
  const scope = { type: "course" as const, courseId };

  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Sparkle size={28} weight="duotone" className="mx-auto text-primary" />
        <h2 className="mt-2 font-heading text-lg font-bold text-foreground">
          Bu derse AI ile çalış
        </h2>
        <p className="mt-1 text-sm text-muted">
          Çalışma planı çıkar, kendini test et, notları özetle.
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

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkle size={22} weight="duotone" className="text-primary" />
        <h2 className="font-heading text-lg font-bold text-card-foreground">
          Bu derse çalış (AI)
        </h2>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled={loading}
            onClick={() => send(a.prompt, scope)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <a.Icon size={15} /> {a.label}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <ChatMessages
          messages={messages}
          loading={loading}
          className="mt-4 max-h-[480px] rounded-xl border border-border bg-background/40 p-4"
        />
      )}

      {notice && <p className="mt-2 text-center text-xs text-muted">{notice}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const msg = input;
          setInput("");
          send(msg, scope);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bu derse soru sor..."
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Gönder"
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>

      {showUpsell && <AiUpsellModal onClose={() => setShowUpsell(false)} />}
    </div>
  );
}
