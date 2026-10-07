"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATALOG_PREFIX, departmentOptions } from "@/lib/departmentCatalog";
import { Combobox } from "@/components/ui/Combobox";
import Link from "next/link";
import { Books, Buildings, ChalkboardTeacher, GraduationCap, Plus } from "@phosphor-icons/react";

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
  courses,
  defaultUniversityId = null,
  defaultDepartmentId = null,
}: {
  userId: string;
  universities: University[];
  departments: Department[];
  courses: { id: string; name: string; department_id: string }[];
  defaultUniversityId?: string | null;
  defaultDepartmentId?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [universityId, setUniversityId] = useState(defaultUniversityId ?? "");
  const [newUniName, setNewUniName] = useState("");
  const [newUniCity, setNewUniCity] = useState("");

  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
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

  const existingCourses = courses.filter((c) => c.department_id === departmentId);
  const typed = courseName.trim().toLocaleLowerCase("tr");
  const duplicate = typed
    ? existingCourses.find((c) => c.name.toLocaleLowerCase("tr") === typed)
    : undefined;

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Ders Ekle</h1>
        <p className="mt-1 text-sm text-muted">
          Aradığın üniversite, bölüm ya da ders yoksa buradan ekle; topluluk doğrulasın.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
        <StepTitle n={1} title="Nerede?" />
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={newUniName} onChange={(e) => setNewUniName(e.target.value)} placeholder="Üniversite adı" className={inputClass} />
            <input value={newUniCity} onChange={(e) => setNewUniCity(e.target.value)} placeholder="Şehir" className={inputClass} />
          </div>
        )}
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
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
        <StepTitle n={2} title="Hangi ders?" />
        {existingCourses.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted">Bu bölümde zaten olan dersler (aradığın buradaysa tıkla):</p>
            <div className="flex flex-wrap gap-2">
              {existingCourses.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="relative">
          <Books size={18} weight="duotone" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Ders adı (ör. Veri Yapıları)"
            maxLength={120}
            className={`${inputClass} pl-11`}
          />
        </div>
        {duplicate && (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-foreground">
            Bu ders zaten var.{" "}
            <Link href={`/courses/${duplicate.id}`} className="font-medium text-primary hover:underline">
              Ders sayfasına git →
            </Link>
          </p>
        )}
        <div className="relative">
          <ChalkboardTeacher size={18} weight="duotone" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            placeholder="Hoca adı (opsiyonel)"
            maxLength={80}
            className={`${inputClass} pl-11`}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        <Plus size={18} weight="bold" />
        {saving ? "Ekleniyor..." : "Dersi Ekle"}
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
