"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATALOG_PREFIX, departmentOptions } from "@/lib/departmentCatalog";
import { Combobox } from "@/components/ui/Combobox";
import { Buildings, GraduationCap } from "@phosphor-icons/react";

const NEW = "__new__";

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

export function AddCourseForm({
  userId,
  universities,
  departments,
}: {
  userId: string;
  universities: University[];
  departments: Department[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [universityId, setUniversityId] = useState("");
  const [newUniName, setNewUniName] = useState("");
  const [newUniCity, setNewUniCity] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [newDeptName, setNewDeptName] = useState("");

  const [courseName, setCourseName] = useState("");
  const [instructor, setInstructor] = useState("");

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
    const name = newUniName.trim();
    const ins = await supabase
      .from("universities")
      .insert({ name, city: newUniCity.trim(), created_by: userId })
      .select("id")
      .single();
    if (!ins.error) return ins.data.id;
    if (ins.error.code === "23505") {
      const ex = await supabase
        .from("universities")
        .select("id")
        .eq("name", name)
        .single();
      if (ex.data) return ex.data.id;
    }
    throw new Error(ins.error.message);
  }

  async function resolveDepartment(uniId: string): Promise<string> {
    if (!isNewDept && !isCatalogDept) return departmentId;
    const name = isCatalogDept
      ? departmentId.slice(CATALOG_PREFIX.length)
      : newDeptName.trim();
    const ins = await supabase
      .from("departments")
      .insert({ university_id: uniId, name, created_by: userId })
      .select("id")
      .single();
    if (!ins.error) return ins.data.id;
    if (ins.error.code === "23505") {
      const ex = await supabase
        .from("departments")
        .select("id")
        .eq("university_id", uniId)
        .eq("name", name)
        .single();
      if (ex.data) return ex.data.id;
    }
    throw new Error(ins.error.message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isNewUni && (!newUniName.trim() || !newUniCity.trim()))
      return setError("Yeni üniversite için ad ve şehir gerekli.");
    if (!isNewUni && !universityId)
      return setError("Üniversite seç veya yeni ekle.");
    if (isNewDept && !newDeptName.trim())
      return setError("Bölüm adı gerekli.");
    if (!isNewDept && !departmentId)
      return setError("Bölüm seç veya yeni ekle.");
    if (!courseName.trim()) return setError("Ders adı gerekli.");

    setSaving(true);
    try {
      const uniId = await resolveUniversity();
      const depId = await resolveDepartment(uniId);

      const ins = await supabase
        .from("courses")
        .insert({
          department_id: depId,
          name: courseName.trim(),
          instructor: instructor.trim() || null,
          created_by: userId,
        })
        .select("id")
        .single();

      let courseId: string;
      if (!ins.error) {
        courseId = ins.data.id;
      } else if (ins.error.code === "23505") {
        // Ders zaten var → mevcut derse yönlendir
        const ex = await supabase
          .from("courses")
          .select("id")
          .eq("department_id", depId)
          .eq("name", courseName.trim())
          .single();
        if (!ex.data) throw new Error(ins.error.message);
        courseId = ex.data.id;
      } else {
        throw new Error(ins.error.message);
      }

      router.push(`/courses/${courseId}`);
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
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Ders Ekle
      </h1>
      <p className="text-sm text-muted">
        Aradığın üniversite, bölüm ya da ders yoksa buradan ekleyebilirsin.
      </p>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Üniversite */}
      <Combobox
        icon={<Buildings size={18} weight="duotone" />}
        placeholder="Üniversite seç"
        searchPlaceholder="Üniversite ya da şehir ara..."
        options={universities.map((u) => ({ value: u.id, label: u.name, hint: u.city }))}
        value={isNewUni ? "" : universityId}
        onChange={(v) => {
          setUniversityId(v);
          setDepartmentId("");
        }}
        createLabel="Yeni üniversite ekle"
        onCreate={(q) => {
          setUniversityId(NEW);
          setNewUniName(q);
          setDepartmentId("");
        }}
      />

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

      {/* Bölüm */}
      {!isNewUni && (
        <Combobox
          icon={<GraduationCap size={18} weight="duotone" />}
          placeholder={universityId ? "Bölüm seç" : "Önce üniversite seç"}
          searchPlaceholder="Bölüm ara..."
          disabled={!universityId}
          options={availableDepartments}
          value={departmentId === NEW ? "" : departmentId}
          onChange={setDepartmentId}
          createLabel="Yeni bölüm ekle"
          onCreate={(q) => {
            setDepartmentId(NEW);
            setNewDeptName(q);
          }}
        />
      )}

      {isNewDept && (universityId || isNewUni) && (
        <input
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          placeholder="Bölüm adı (ör. Bilgisayar Mühendisliği)"
          className={inputClass}
        />
      )}

      {/* Ders */}
      <input
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
        placeholder="Ders adı (ör. Veri Yapıları)"
        className={inputClass}
      />
      <input
        value={instructor}
        onChange={(e) => setInstructor(e.target.value)}
        placeholder="Hoca adı (opsiyonel)"
        className={inputClass}
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ekleniyor..." : "Dersi Ekle"}
      </button>
    </form>
  );
}
