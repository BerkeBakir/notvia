"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATALOG_PREFIX, departmentOptions } from "@/lib/departmentCatalog";

const NEW = "__new__";
const CLASS_OPTIONS = [
  "Hazırlık",
  "1. Sınıf",
  "2. Sınıf",
  "3. Sınıf",
  "4. Sınıf",
  "5. Sınıf",
  "6. Sınıf",
  "Yüksek Lisans",
  "Doktora",
  "Mezun",
];

interface University {
  id: string;
  name: string;
  city: string;
}
interface Department {
  id: string;
  name: string;
  university_id: string;
}

export function ProfileForm({
  userId,
  initial,
  universities,
  departments,
  next,
}: {
  userId: string;
  initial: {
    name: string;
    universityId: string | null;
    departmentId: string | null;
    classYear: string | null;
  };
  universities: University[];
  departments: Department[];
  next: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initial.name ?? "");
  const [universityId, setUniversityId] = useState(initial.universityId ?? "");
  const [newUniName, setNewUniName] = useState("");
  const [newUniCity, setNewUniCity] = useState("");
  const [departmentId, setDepartmentId] = useState(initial.departmentId ?? "");
  const [newDeptName, setNewDeptName] = useState("");
  const [classYear, setClassYear] = useState(initial.classYear ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isNewUni = universityId === NEW;
  const availableDepartments = useMemo(
    () =>
      isNewUni
        ? []
        : departmentOptions(
            departments.filter((d) => d.university_id === universityId),
          ),
    [departments, universityId, isNewUni],
  );
  const isNewDept = isNewUni || departmentId === NEW;
  const isCatalogDept = departmentId.startsWith(CATALOG_PREFIX);

  async function resolveUniversity(): Promise<string> {
    if (!isNewUni) return universityId;
    const nm = newUniName.trim();
    const ins = await supabase
      .from("universities")
      .insert({ name: nm, city: newUniCity.trim(), created_by: userId })
      .select("id")
      .single();
    if (!ins.error) return ins.data.id;
    if (ins.error.code === "23505") {
      const ex = await supabase
        .from("universities")
        .select("id")
        .eq("name", nm)
        .single();
      if (ex.data) return ex.data.id;
    }
    throw new Error(ins.error.message);
  }

  async function resolveDepartment(uniId: string): Promise<string> {
    if (!isNewDept && !isCatalogDept) return departmentId;
    const nm = isCatalogDept
      ? departmentId.slice(CATALOG_PREFIX.length)
      : newDeptName.trim();
    const ins = await supabase
      .from("departments")
      .insert({ university_id: uniId, name: nm, created_by: userId })
      .select("id")
      .single();
    if (!ins.error) return ins.data.id;
    if (ins.error.code === "23505") {
      const ex = await supabase
        .from("departments")
        .select("id")
        .eq("university_id", uniId)
        .eq("name", nm)
        .single();
      if (ex.data) return ex.data.id;
    }
    throw new Error(ins.error.message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Ad soyad gerekli.");
    if (isNewUni && (!newUniName.trim() || !newUniCity.trim()))
      return setError("Yeni üniversite için ad ve şehir gerekli.");
    if (!isNewUni && !universityId) return setError("Üniversite seç.");
    if (isNewDept && !newDeptName.trim()) return setError("Bölüm adı gerekli.");
    if (!isNewDept && !departmentId) return setError("Bölüm seç.");
    if (!classYear) return setError("Sınıf seç.");

    setSaving(true);
    try {
      const uniId = await resolveUniversity();
      const depId = await resolveDepartment(uniId);

      const { error: upErr } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          university_id: uniId,
          department_id: depId,
          class_year: classYear,
        })
        .eq("id", userId);
      if (upErr) throw new Error(upErr.message);

      router.push(next || "/notes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Profilini Tamamla
        </h1>
        <p className="mt-1 text-sm text-muted">
          Not yükleyebilmek ve sana uygun içerikleri görebilmek için bu bilgiler
          gerekli.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ad Soyad"
        className={inputClass}
      />

      <select
        value={universityId}
        onChange={(e) => {
          setUniversityId(e.target.value);
          setDepartmentId("");
        }}
        className={inputClass}
      >
        <option value="">Üniversite seç</option>
        <option value={NEW}>+ Yeni üniversite ekle</option>
        {universities.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} — {u.city}
          </option>
        ))}
      </select>

      {isNewUni && (
        <div className="flex gap-3">
          <input
            value={newUniName}
            onChange={(e) => setNewUniName(e.target.value)}
            placeholder="Üniversite adı"
            className={inputClass}
          />
          <input
            value={newUniCity}
            onChange={(e) => setNewUniCity(e.target.value)}
            placeholder="Şehir"
            className={inputClass}
          />
        </div>
      )}

      {!isNewUni && (
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          disabled={!universityId}
          className={inputClass}
        >
          <option value="">Bölüm seç</option>
          <option value={NEW}>+ Yeni bölüm ekle</option>
          {availableDepartments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      )}

      {isNewDept && (universityId || isNewUni) && (
        <input
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          placeholder="Bölüm adı (ör. Bilgisayar Mühendisliği)"
          className={inputClass}
        />
      )}

      <select
        value={classYear}
        onChange={(e) => setClassYear(e.target.value)}
        className={inputClass}
      >
        <option value="">Sınıf seç</option>
        {CLASS_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
