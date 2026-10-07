"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Combobox } from "@/components/ui/Combobox";
import { Bell, BellSlash, Books, CalendarPlus, MapPin, Trash } from "@phosphor-icons/react";

export interface Exam {
  id: string;
  course_id: string | null;
  title: string;
  kind: string;
  exam_at: string;
  location: string | null;
  remind: boolean;
}

const KINDS = [
  ["vize", "Vize"],
  ["final", "Final"],
  ["quiz", "Quiz"],
  ["butunleme", "Bütünleme"],
  ["odev", "Ödev teslim"],
  ["diger", "Diğer"],
] as const;
const KIND_LABEL = Object.fromEntries(KINDS) as Record<string, string>;

function countdown(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return { text: "Geçti", urgency: "past" as const };
  const h = Math.floor(ms / 3600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return { text: `${d} gün ${h % 24} sa`, urgency: d <= 3 ? ("soon" as const) : ("later" as const) };
  const m = Math.floor((ms % 3600_000) / 60_000);
  return { text: `${h} sa ${m} dk`, urgency: "today" as const };
}

export function ExamPlanner({
  userId,
  initial,
  courses,
}: {
  userId: string;
  initial: Exam[];
  courses: { id: string; name: string; hint?: string }[];
}) {
  const supabase = createClient();
  const [exams, setExams] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [courseId, setCourseId] = useState("");
  const [kind, setKind] = useState<string>("vize");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const courseName = useMemo(() => new Map(courses.map((c) => [c.id, c.name])), [courses]);
  const upcoming = exams.filter((e) => new Date(e.exam_at).getTime() > now).sort((a, b) => a.exam_at.localeCompare(b.exam_at));
  const past = exams.filter((e) => new Date(e.exam_at).getTime() <= now).sort((a, b) => b.exam_at.localeCompare(a.exam_at));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const t = title.trim() || (courseId ? `${courseName.get(courseId)} ${KIND_LABEL[kind]}` : "");
    if (t.length < 2) return setError("Bir ders seç ya da sınava bir ad ver.");
    if (!date) return setError("Tarih seç.");
    const at = new Date(`${date}T${time || "10:00"}`);
    if (Number.isNaN(at.getTime())) return setError("Geçersiz tarih.");
    setSaving(true);
    const { data, error: err } = await supabase
      .from("exams")
      .insert({
        user_id: userId,
        course_id: courseId || null,
        title: t.slice(0, 120),
        kind,
        exam_at: at.toISOString(),
        location: location.trim() || null,
      })
      .select("id,course_id,title,kind,exam_at,location,remind")
      .single();
    setSaving(false);
    if (err || !data) return setError("Eklenemedi, tekrar dene.");
    setExams((x) => [...x, data as Exam]);
    setTitle("");
    setLocation("");
    setDate("");
  }

  async function remove(id: string) {
    setExams((x) => x.filter((e) => e.id !== id));
    await supabase.from("exams").delete().eq("id", id);
  }

  async function toggleRemind(ex: Exam) {
    setExams((x) => x.map((e) => (e.id === ex.id ? { ...e, remind: !e.remind } : e)));
    await supabase.from("exams").update({ remind: !ex.remind }).eq("id", ex.id);
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

  const Card = ({ ex }: { ex: Exam }) => {
    const cd = countdown(ex.exam_at, now);
    const d = new Date(ex.exam_at);
    const color =
      cd.urgency === "today"
        ? "bg-red-500/15 text-red-400 border-red-500/40"
        : cd.urgency === "soon"
          ? "bg-accent/15 text-accent border-accent/40"
          : cd.urgency === "past"
            ? "bg-border/60 text-muted border-border"
            : "bg-primary/10 text-primary border-primary/30";
    return (
      <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="w-14 shrink-0 rounded-xl border border-border bg-background/50 py-1.5 text-center">
          <div className="text-[10px] uppercase text-muted">{d.toLocaleDateString("tr-TR", { month: "short" })}</div>
          <div className="font-heading text-xl font-bold leading-none text-foreground">{d.getDate()}</div>
          <div className="text-[10px] text-muted">{d.toLocaleDateString("tr-TR", { weekday: "short" })}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{ex.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span className="rounded-full bg-border/60 px-2 py-0.5">{KIND_LABEL[ex.kind] ?? ex.kind}</span>
            {d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            {ex.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={12} /> {ex.location}
              </span>
            )}
          </p>
          {ex.course_id && cd.urgency !== "past" && (
            <Link
              href={`/courses/${ex.course_id}`}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Books size={13} /> Bu dersin notlarına çalış →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${color}`}>{cd.text}</span>
          {cd.urgency !== "past" && (
            <button
              type="button"
              onClick={() => toggleRemind(ex)}
              title={ex.remind ? "E-posta hatırlatması açık (3 gün + 1 gün önce)" : "Hatırlatma kapalı"}
              className={`rounded-lg p-1.5 transition ${ex.remind ? "text-primary" : "text-muted"} hover:bg-background`}
            >
              {ex.remind ? <Bell size={18} weight="fill" /> : <BellSlash size={18} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => remove(ex.id)}
            aria-label="Sil"
            className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-red-400"
          >
            <Trash size={18} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          <CalendarPlus size={20} weight="duotone" className="text-primary" /> Sınav ekle
        </h2>
        <Combobox
          icon={<Books size={18} weight="duotone" />}
          placeholder="Ders seç (opsiyonel)"
          searchPlaceholder="Ders ara..."
          clearable
          emptyText="Ders bulunamadı — aşağıya sınavın adını yazabilirsin"
          options={courses.map((c) => ({ value: c.id, label: c.name, hint: c.hint }))}
          value={courseId}
          onChange={setCourseId}
        />
        <div className="flex flex-wrap gap-2">
          {KINDS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setKind(v)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                kind === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={courseId ? `${courseName.get(courseId)} ${KIND_LABEL[kind]} (değiştirmek istersen yaz)` : "Sınavın adı (ör. Fizik 2 Vize)"}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={100}
            placeholder="Yer (opsiyonel)"
            className={`${inputClass} col-span-2 sm:col-span-1`}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">📧 Sınavdan 3 gün ve 1 gün önce e-posta ile hatırlatırız.</p>
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Yaklaşan sınavlar <span className="text-sm font-normal text-muted">{upcoming.length}</span>
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Yaklaşan sınav yok. Yukarıdan ekle; geri sayım ve hatırlatma bizden 📅
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((ex) => (
              <Card key={ex.id} ex={ex} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <button type="button" onClick={() => setShowPast((v) => !v)} className="text-sm text-muted hover:text-foreground">
            {showPast ? "▾" : "▸"} Geçmiş sınavlar ({past.length})
          </button>
          {showPast && (
            <ul className="mt-3 space-y-2 opacity-80">
              {past.map((ex) => (
                <Card key={ex.id} ex={ex} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
