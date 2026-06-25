"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const MAX_SIZE = 20 * 1024 * 1024; // 20MB (ücretsiz plan limiti)

export function UploadForm({
  userId,
  universities,
  departments,
  courses,
  defaultUniversityId = null,
  defaultDepartmentId = null,
}: {
  userId: string;
  universities: Option[];
  departments: Department[];
  courses: Course[];
  defaultUniversityId?: string | null;
  defaultDepartmentId?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [universityId, setUniversityId] = useState(defaultUniversityId ?? "");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState<"note" | "exam">("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function linkTags(noteId: string) {
    const names = [
      ...new Set(
        tagsInput
          .split(",")
          .map((t) => t.trim().toLocaleLowerCase("tr"))
          .filter(Boolean),
      ),
    ].slice(0, 5);

    for (const name of names) {
      let tagId: string | undefined;
      const ins = await supabase.from("tags").insert({ name }).select("id").single();
      if (!ins.error) tagId = ins.data.id;
      else if (ins.error.code === "23505") {
        const ex = await supabase.from("tags").select("id").eq("name", name).single();
        tagId = ex.data?.id;
      }
      if (tagId) {
        await supabase.from("note_tags").insert({ note_id: noteId, tag_id: tagId });
      }
    }
  }

  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.university_id === universityId),
    [departments, universityId],
  );
  const filteredCourses = useMemo(
    () => courses.filter((c) => c.department_id === departmentId),
    [courses, departmentId],
  );

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const f = e.target.files?.[0] ?? null;
    if (f) {
      const isPdf =
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError("Sadece PDF formatında dosya yükleyebilirsin.");
        e.target.value = "";
        setFile(null);
        return;
      }
      if (f.size > MAX_SIZE) {
        setError("Dosya boyutu en fazla 20MB olabilir.");
        e.target.value = "";
        setFile(null);
        return;
      }
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!courseId) return setError("Lütfen üniversite, bölüm ve ders seç.");
    if (!title.trim()) return setError("Başlık gerekli.");
    if (!file) return setError("Lütfen bir PDF dosyası seç.");

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("notes")
        .upload(path, file, { contentType: "application/pdf" });
      if (upErr) throw new Error(upErr.message);

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

      // Etiketleri bağla (best-effort)
      try {
        await linkTags(inserted.id);
      } catch {
        // etiket hatası yüklemeyi bozmasın
      }

      // Abonelere e-posta bildirimi (best-effort, hata yüklemeyi bozmaz)
      try {
        await fetch("/api/notify-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ noteId: inserted.id }),
        });
      } catch {
        // bildirim başarısız olsa da yüklemeyi tamamla
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setUploading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Not / Sınav Yükle
      </h1>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <select
        value={universityId}
        onChange={(e) => {
          setUniversityId(e.target.value);
          setDepartmentId("");
          setCourseId("");
        }}
        className={inputClass}
      >
        <option value="">Üniversite seç</option>
        {universities.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <select
        value={departmentId}
        onChange={(e) => {
          setDepartmentId(e.target.value);
          setCourseId("");
        }}
        disabled={!universityId}
        className={inputClass}
      >
        <option value="">Bölüm seç</option>
        {filteredDepartments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        disabled={!departmentId}
        className={inputClass}
      >
        <option value="">Ders seç</option>
        {filteredCourses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex gap-3">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-muted has-[:checked]:border-primary has-[:checked]:text-primary">
          <input
            type="radio"
            name="type"
            checked={type === "note"}
            onChange={() => setType("note")}
          />
          Ders Notu
        </label>
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-muted has-[:checked]:border-primary has-[:checked]:text-primary">
          <input
            type="radio"
            name="type"
            checked={type === "exam"}
            onChange={() => setType("exam")}
          />
          Sınav Sorusu
        </label>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Başlık (ör. 2023 Final Çözümleri)"
        className={inputClass}
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Açıklama (opsiyonel)"
        rows={3}
        className={inputClass}
      />

      <div>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Etiketler (virgülle ayır, ör. final, özet, 2024)"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">En fazla 5 etiket</p>
      </div>

      <div>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={onFileChange}
          className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-primary-foreground hover:file:opacity-90"
        />
        <p className="mt-1 text-xs text-muted">
          Yalnızca PDF · en fazla 20MB
        </p>
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {uploading ? "Yükleniyor..." : "Yükle"}
      </button>
    </form>
  );
}
