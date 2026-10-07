"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Gift, Lock } from "@phosphor-icons/react";

export interface Quest {
  quest_key: string;
  progress: number;
  target: number;
  points: number;
  claimed: boolean;
}

const META: Record<string, { icon: string; title: string; desc: string; href?: string; cta?: string }> = {
  upload: { icon: "📤", title: "Bir not paylaş", desc: "Bu hafta en az 1 not ya da sınav sorusu yükle.", href: "/notes/upload", cta: "Yükle" },
  comment: { icon: "💬", title: "3 yorum yap", desc: "Notlara teşekkür et, soru sor, ek bilgi ver.", href: "/notes", cta: "Notlara git" },
  like: { icon: "👍", title: "5 notu beğen", desc: "İşine yarayan notları beğenerek öne çıkar.", href: "/search", cta: "Keşfet" },
  ai: { icon: "🤖", title: "AI'a 5 soru sor", desc: "Notlardan kaynaklı cevap al, konuyu pekiştir.", href: "/asistan", cta: "Asistan" },
  friend: { icon: "🤝", title: "1 arkadaş ekle", desc: "Sınıf arkadaşını bul ya da davet et.", href: "/arkadaslar?tab=bul", cta: "Arkadaş bul" },
  streak: { icon: "🔥", title: "5 günlük seri", desc: "5 gün üst üste Notvia'ya uğra.", cta: "" },
  all: { icon: "🌟", title: "Haftanın yıldızı", desc: "Bu haftaki 6 görevin ödülünü al, bonus kazan." },
};

export function QuestBoard({ initial, daysLeft }: { initial: Quest[]; daysLeft: number }) {
  const supabase = createClient();
  const [quests, setQuests] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  async function claim(q: Quest) {
    setBusy(q.quest_key);
    const { data } = await supabase.rpc("claim_weekly_quest", { p_key: q.quest_key });
    setBusy(null);
    if (typeof data === "number" && data > 0) {
      setToast(`+${data} puan kazandın! 🎉`);
      setTimeout(() => setToast(""), 2500);
      setQuests((list) =>
        list.map((x) =>
          x.quest_key === q.quest_key
            ? { ...x, claimed: true }
            : x.quest_key === "all" && q.quest_key !== "all"
              ? { ...x, progress: Math.min(x.target, x.progress + 1) }
              : x,
        ),
      );
    }
  }

  const earned = quests.filter((q) => q.claimed).reduce((a, q) => a + q.points, 0);
  const total = quests.reduce((a, q) => a + q.points, 0);
  const ordered = [...quests.filter((q) => q.quest_key !== "all"), ...quests.filter((q) => q.quest_key === "all")];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm text-muted">Bu hafta kazandığın</p>
          <p className="font-heading text-3xl font-bold tabular-nums text-foreground">
            {earned} <span className="text-base font-normal text-muted">/ {total} puan</span>
          </p>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          ⏳ Yenilenmesine {daysLeft} gün
        </span>
      </div>

      {toast && (
        <p className="animate-fade-up rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-center text-sm font-medium text-primary">
          {toast}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ordered.map((q) => {
          const m = META[q.quest_key] ?? { icon: "⭐", title: q.quest_key, desc: "" };
          const done = q.progress >= q.target;
          const pct = Math.round((q.progress / q.target) * 100);
          const isAll = q.quest_key === "all";
          return (
            <li
              key={q.quest_key}
              className={`flex flex-col rounded-2xl border p-4 transition ${
                q.claimed
                  ? "border-primary/30 bg-primary/5 opacity-80"
                  : done
                    ? "border-accent/50 bg-accent/5 ring-4 ring-accent/10"
                    : "border-border bg-card"
              } ${isAll ? "sm:col-span-2" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted">{m.desc}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  +{q.points}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${done ? "bg-accent" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted">
                  {q.progress}/{q.target}
                </span>
              </div>
              <div className="mt-3 flex justify-end">
                {q.claimed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle size={14} weight="fill" /> Alındı
                  </span>
                ) : done ? (
                  <button
                    type="button"
                    disabled={busy === q.quest_key}
                    onClick={() => claim(q)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                  >
                    <Gift size={14} weight="fill" /> Ödülü al
                  </button>
                ) : m.href ? (
                  <Link href={m.href} className="text-xs font-medium text-primary hover:underline">
                    {m.cta} →
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <Lock size={12} /> Devam et
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
