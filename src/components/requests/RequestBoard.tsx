"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowFatUp, CheckCircle, HandWaving, Plus, UploadSimple, X } from "@phosphor-icons/react";

export interface RequestItem {
  id: string;
  title: string;
  detail: string | null;
  status: "open" | "fulfilled" | "closed";
  user_id: string;
  course_id: string;
  fulfilled_note_id: string | null;
  created_at: string;
  votes: number;
  voted: boolean;
  requesterName?: string;
  courseLabel?: string; // /istekler sayfasında: "Ders · Üniversite"
}

function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))} dk önce`;
  if (d < 86400) return `${Math.round(d / 3600)} sa önce`;
  return `${Math.round(d / 86400)} gün önce`;
}

/** Not istekleri listesi + (courseId verilirse) yeni istek formu. */
export function RequestBoard({
  items,
  userId,
  courseId,
  showCreate = true,
}: {
  items: RequestItem[];
  userId: string | null;
  courseId?: string;
  showCreate?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [list, setList] = useState(items);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function vote(r: RequestItem) {
    if (!userId) return router.push("/login");
    if (r.user_id === userId) return;
    setList((l) => l.map((x) => (x.id === r.id ? { ...x, voted: !x.voted, votes: x.votes + (x.voted ? -1 : 1) } : x)));
    if (r.voted) {
      await supabase.from("note_request_votes").delete().eq("request_id", r.id).eq("user_id", userId);
    } else {
      await supabase.from("note_request_votes").insert({ request_id: r.id, user_id: userId });
    }
  }

  async function close(r: RequestItem) {
    await supabase.from("note_requests").update({ status: "closed" }).eq("id", r.id);
    setList((l) => l.filter((x) => x.id !== r.id));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return router.push("/login");
    if (title.trim().length < 3) return setError("Ne istediğini biraz daha açık yaz.");
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("note_requests")
      .insert({ user_id: userId, course_id: courseId, title: title.trim(), detail: detail.trim() || null })
      .select("id,title,detail,status,user_id,course_id,fulfilled_note_id,created_at")
      .single();
    setSaving(false);
    if (err || !data) return setError("İstek açılamadı, tekrar dene.");
    setList((l) => [{ ...(data as RequestItem), votes: 0, voted: false, requesterName: "Sen" }, ...l]);
    setTitle("");
    setDetail("");
    setFormOpen(false);
  }

  const open = list.filter((r) => r.status === "open").sort((a, b) => b.votes - a.votes);
  const done = list.filter((r) => r.status === "fulfilled").slice(0, 5);

  return (
    <div className="space-y-3">
      {showCreate && courseId && (
        <>
          {!formOpen ? (
            <button
              type="button"
              onClick={() => (userId ? setFormOpen(true) : router.push("/login"))}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-4 py-2 text-sm text-primary transition hover:bg-primary/5"
            >
              <Plus size={16} weight="bold" /> Aradığın not yok mu? İstek aç
            </button>
          ) : (
            <form onSubmit={create} className="animate-fade-up space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                autoFocus
                placeholder="Ne lazım? (ör. 2024 final soruları ve çözümleri)"
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
              />
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Detay (opsiyonel) — hangi hoca, hangi konular?"
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-full px-4 py-2 text-sm text-muted hover:text-foreground">
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Açılıyor..." : "İsteği aç"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {open.length === 0 && done.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          Açık istek yok. {courseId ? "İlk isteği sen aç — biri yükleyince sana haber verelim." : ""}
        </p>
      )}

      <ul className="space-y-2">
        {open.map((r) => (
          <li key={r.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <button
              type="button"
              onClick={() => vote(r)}
              disabled={r.user_id === userId}
              title={r.user_id === userId ? "Senin isteğin" : r.voted ? "Vazgeç" : "Ben de istiyorum"}
              className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-xs transition ${
                r.voted ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:border-primary/50 hover:text-primary"
              }`}
            >
              <ArrowFatUp size={18} weight={r.voted ? "fill" : "regular"} />
              <span className="font-medium tabular-nums">{r.votes + 1}</span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{r.title}</p>
              {r.detail && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{r.detail}</p>}
              <p className="mt-1 text-xs text-muted">
                {r.courseLabel && (
                  <Link href={`/courses/${r.course_id}`} className="text-primary hover:underline">
                    {r.courseLabel}
                  </Link>
                )}
                {r.courseLabel && " · "}
                {r.requesterName ?? "Bir öğrenci"} · {ago(r.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {r.user_id !== userId ? (
                <Link
                  href={`/notes/upload?course=${r.course_id}&request=${r.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <UploadSimple size={14} weight="bold" /> Ben yüklerim
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => close(r)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  <X size={12} /> Kapat
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {done.length > 0 && (
        <div>
          <p className="mb-1.5 mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <HandWaving size={14} /> Karşılananlar
          </p>
          <ul className="space-y-1">
            {done.map((r) => (
              <li key={r.id}>
                <Link
                  href={r.fulfilled_note_id ? `/notes/${r.fulfilled_note_id}` : `/courses/${r.course_id}`}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-card hover:text-foreground"
                >
                  <CheckCircle size={16} weight="fill" className="shrink-0 text-primary" />
                  <span className="truncate">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
