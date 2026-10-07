"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Combobox } from "@/components/ui/Combobox";
import {
  Books,
  Buildings,
  CheckCircle,
  ClipboardText,
  FilePdf,
  GraduationCap,
  Notebook,
  Sparkle,
  UploadSimple,
  X,
} from "@phosphor-icons/react";

interface Option {
  id: string;
  name: string;
}
interface Department extends Option {
  university_id: string;
}
interface Course extends Option {
  department_id: string;
}

const MAX_SIZE = 40 * 1024 * 1024; // 40MB
const MAX_TAGS = 5;

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; pct: number; etaSec: number | null }
  | { kind: "saving" }
  | { kind: "indexing" }
  | { kind: "done" };

function fmtSize(b: number) {
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fmtEta(s: number) {
  if (s < 5) return "birkaç saniye";
  if (s < 60) return `~${Math.ceil(s / 5) * 5} sn`;
  const m = Math.floor(s / 60);
  const r = Math.round((s % 60) / 10) * 10;
  return r ? `~${m} dk ${r} sn` : `~${m} dk`;
}

/** Supabase Storage'a XHR ile yükleme — fetch ilerleme vermediği için. */
function uploadWithProgress(
  url: string,
  token: string,
  apikey: string,
  file: File,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apikey);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded, e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Yükleme başarısız (${xhr.status})`;
      try {
        msg = JSON.parse(xhr.responseText).message ?? msg;
      } catch {}
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Bağlantı hatası — internetini kontrol edip tekrar dene."));
    xhr.send(file);
  });
}

export function UploadForm({
  userId,
  universities,
  departments,
  courses,
  defaultUniversityId = null,
  defaultDepartmentId = null,
  defaultCourseId = null,
  request = null,
}: {
  userId: string;
  universities: Option[];
  departments: Department[];
  courses: Course[];
  defaultUniversityId?: string | null;
  defaultDepartmentId?: string | null;
  defaultCourseId?: string | null;
  /** Bir not isteğini karşılamak için gelindiyse */
  request?: { id: string; title: string } | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [universityId, setUniversityId] = useState(defaultUniversityId ?? "");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [courseId, setCourseId] = useState(defaultCourseId ?? "");
  const [type, setType] = useState<"note" | "exam">("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const busy = phase.kind !== "idle";

  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.university_id === universityId),
    [departments, universityId],
  );
  const filteredCourses = useMemo(
    () => courses.filter((c) => c.department_id === departmentId),
    [courses, departmentId],
  );

  function addTag(raw: string) {
    const t = raw.trim().replace(/^#/, "").toLocaleLowerCase("tr");
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return;
    setTags([...tags, t]);
  }

  function acceptFile(f: File | null) {
    setError("");
    if (!f) return setFile(null);
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setError("Sadece PDF formatında dosya yükleyebilirsin.");
    if (f.size > MAX_SIZE) return setError("Dosya boyutu en fazla 40MB olabilir.");
    setFile(f);
    // Başlık boşsa dosya adından öner
    if (!title.trim()) {
      setTitle(f.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim());
    }
  }

  async function linkTags(noteId: string) {
    for (const name of tags) {
      let tagId: string | undefined;
      const ins = await supabase.from("tags").insert({ name }).select("id").single();
      if (!ins.error) tagId = ins.data.id;
      else if (ins.error.code === "23505") {
        const ex = await supabase.from("tags").select("id").eq("name", name).single();
        tagId = ex.data?.id;
      }
      if (tagId) await supabase.from("note_tags").insert({ note_id: noteId, tag_id: tagId });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!courseId) return setError("Lütfen üniversite, bölüm ve ders seç.");
    if (!title.trim()) return setError("Başlık gerekli.");
    if (!file) return setError("Lütfen bir PDF dosyası seç.");
    if (tagDraft.trim()) addTag(tagDraft);

    setPhase({ kind: "uploading", pct: 0, etaSec: null });
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturumun sona ermiş, tekrar giriş yap.");

      const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const started = performance.now();
      await uploadWithProgress(
        `${base}/storage/v1/object/notes/${path}`,
        session.access_token,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        file,
        (loaded, total) => {
          const elapsed = (performance.now() - started) / 1000;
          const speed = elapsed > 0.3 ? loaded / elapsed : 0; // bayt/sn
          setPhase({
            kind: "uploading",
            pct: Math.round((loaded / total) * 100),
            etaSec: speed ? (total - loaded) / speed : null,
          });
        },
      );

      setPhase({ kind: "saving" });
      const {
        data: { publicUrl },
      } = supabase.storage.from("notes").getPublicUrl(path);

      const { data: inserted, error: insErr } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          file_url: publicUrl,
          type,
          course_id: courseId,
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);

      // İsteği karşıla (isteyenlere bildirim gider)
      if (request) {
        await supabase.rpc("fulfill_note_request", { p_request: request.id, p_note: inserted.id });
      }

      // Etiket + abone bildirimi (best-effort, yüklemeyi bozmaz)
      await Promise.allSettled([
        linkTags(inserted.id),
        fetch("/api/notify-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ noteId: inserted.id }),
        }),
      ]);

      // AI indeksleme (best-effort)
      setPhase({ kind: "indexing" });
      try {
        await fetch("/api/ai/index", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ noteId: inserted.id }),
        });
      } catch {
        // indeksleme başarısız olsa da yükleme tamam
      }

      setPhase({ kind: "done" });
      router.push(`/notes/${inserted.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setPhase({ kind: "idle" });
    }
  }

  // Seçilen dosya için tahmini süre (yükleme başlamadan, ~2 MB/sn varsayımıyla)
  const preEta = file ? fmtEta(file.size / (2 * 1024 * 1024)) : null;

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Not / Sınav Yükle
        </h1>
        <p className="mt-1 text-sm text-muted">
          Paylaştığın her not puan kazandırır ve AI asistanı da güçlendirir.
        </p>
      </div>

      {request && (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
          🙋 Bir isteği karşılıyorsun: <b>{request.title}</b> — yükleyince isteyenlere haber gidecek.
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* 1 — Ders */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
        <StepTitle n={1} title="Hangi ders?" />
        <Combobox
          icon={<Buildings size={18} weight="duotone" />}
          placeholder="Üniversite seç"
          searchPlaceholder="Üniversite ara..."
          options={universities.map((u) => ({ value: u.id, label: u.name }))}
          value={universityId}
          onChange={(v) => {
            setUniversityId(v);
            setDepartmentId("");
            setCourseId("");
          }}
        />
        <Combobox
          icon={<GraduationCap size={18} weight="duotone" />}
          placeholder={universityId ? "Bölüm seç" : "Önce üniversite seç"}
          searchPlaceholder="Bölüm ara..."
          disabled={!universityId}
          emptyText="Bu üniversitede henüz bölüm yok"
          options={filteredDepartments.map((d) => ({ value: d.id, label: d.name }))}
          value={departmentId}
          onChange={(v) => {
            setDepartmentId(v);
            setCourseId("");
          }}
        />
        <Combobox
          icon={<Books size={18} weight="duotone" />}
          placeholder={departmentId ? "Ders seç" : "Önce bölüm seç"}
          searchPlaceholder="Ders ara..."
          disabled={!departmentId}
          emptyText="Bu bölümde henüz ders yok"
          options={filteredCourses.map((c) => ({ value: c.id, label: c.name }))}
          value={courseId}
          onChange={setCourseId}
        />
        <p className="text-xs text-muted">
          Dersin listede yok mu?{" "}
          <Link href="/courses/new" className="font-medium text-primary hover:underline">
            Ders ekle
          </Link>
        </p>
      </section>

      {/* 2 — Tür + bilgiler */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
        <StepTitle n={2} title="Ne paylaşıyorsun?" />
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["note", "Ders Notu", "Özet, slayt, defter", Notebook],
              ["exam", "Sınav Sorusu", "Çıkmış vize / final", ClipboardText],
            ] as const
          ).map(([v, label, sub, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                type === v
                  ? "border-primary bg-primary/10 ring-4 ring-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <Icon size={26} weight="duotone" className={type === v ? "text-primary" : "text-muted"} />
              <span>
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted">{sub}</span>
              </span>
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Başlık (ör. 2023 Final Çözümleri)"
          maxLength={150}
          className={inputClass}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Açıklama (opsiyonel) — hangi konular var, kimin dersi?"
          rows={3}
          className={inputClass}
        />

        <div className={`flex flex-wrap items-center gap-2 ${inputClass} py-2`}>
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
              #{t}
              <button type="button" aria-label={`${t} etiketini kaldır`} onClick={() => setTags(tags.filter((x) => x !== t))}>
                <X size={12} weight="bold" />
              </button>
            </span>
          ))}
          {tags.length < MAX_TAGS && (
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagDraft);
                  setTagDraft("");
                } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                  setTags(tags.slice(0, -1));
                }
              }}
              onBlur={() => {
                addTag(tagDraft);
                setTagDraft("");
              }}
              placeholder={tags.length ? "" : "Etiket yaz, Enter'a bas (ör. final, özet, 2024)"}
              style={{ outline: "none" }}
              className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted"
            />
          )}
        </div>
        <p className="-mt-1 text-xs text-muted">En fazla {MAX_TAGS} etiket</p>
      </section>

      {/* 3 — Dosya */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
        <StepTitle n={3} title="PDF dosyası" />
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            acceptFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
            <FilePdf size={34} weight="duotone" className="shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted">
                {fmtSize(file.size)} · tahmini yükleme süresi {preEta}
              </p>
            </div>
            {!busy && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-foreground"
                aria-label="Dosyayı kaldır"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
              dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60 hover:bg-primary/5"
            }`}
          >
            <UploadSimple size={32} weight="duotone" className="text-primary" />
            <span className="text-sm font-medium text-foreground">PDF&apos;i buraya sürükle ya da tıkla</span>
            <span className="text-xs text-muted">Yalnızca PDF · en fazla 40MB</span>
          </button>
        )}
      </section>

      {/* Durum + gönder */}
      {phase.kind !== "idle" && <ProgressPanel phase={phase} />}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        <UploadSimple size={18} weight="bold" />
        {busy ? "Yükleniyor..." : "Yükle"}
      </button>
    </form>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      {title}
    </h2>
  );
}

function ProgressPanel({ phase }: { phase: Phase }) {
  const steps = [
    { key: "uploading", label: "Dosya yükleniyor" },
    { key: "saving", label: "Not kaydediliyor" },
    { key: "indexing", label: "AI için hazırlanıyor" },
  ] as const;
  const order = ["uploading", "saving", "indexing", "done"];
  const cur = order.indexOf(phase.kind);
  const pct = phase.kind === "uploading" ? phase.pct : 100;

  return (
    <div className="animate-fade-up space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5" aria-live="polite">
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {phase.kind === "uploading"
            ? `%${phase.pct} yüklendi`
            : phase.kind === "indexing"
              ? "Neredeyse bitti"
              : phase.kind === "done"
                ? "Tamam! Nota yönlendiriliyorsun"
                : "Kaydediliyor"}
        </span>
        {phase.kind === "uploading" && (
          <span className="text-muted">
            {phase.etaSec == null ? "süre hesaplanıyor…" : `${fmtEta(phase.etaSec)} kaldı`}
          </span>
        )}
      </div>
      <ol className="grid grid-cols-3 gap-2 text-xs">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={`flex items-center gap-1.5 ${i < cur ? "text-primary" : i === cur ? "text-foreground" : "text-muted"}`}
          >
            {i < cur ? (
              <CheckCircle size={14} weight="fill" />
            ) : s.key === "indexing" ? (
              <Sparkle size={14} weight={i === cur ? "fill" : "regular"} />
            ) : (
              <span className={`h-2 w-2 rounded-full ${i === cur ? "animate-pulse bg-primary" : "bg-border"}`} />
            )}
            {s.label}
          </li>
        ))}
      </ol>
      {phase.kind === "indexing" && (
        <p className="text-xs text-muted">
          Büyük veya taranmış PDF&apos;lerde bu adım biraz sürebilir. Sayfayı kapatma.
        </p>
      )}
    </div>
  );
}
