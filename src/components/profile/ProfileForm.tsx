"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeNext } from "@/lib/safeNext";
import { cleanReferralCode, storedReferralCode } from "@/lib/referralCode";
import { Combobox } from "@/components/ui/Combobox";
import { Buildings, GraduationCap } from "@phosphor-icons/react";
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
    termsAccepted: boolean;
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
  const [acceptTerms, setAcceptTerms] = useState(initial.termsAccepted);
  const [acceptAge, setAcceptAge] = useState(initial.termsAccepted);
  const [refCode, setRefCode] = useState("");
  useEffect(() => {
    if (!initial.termsAccepted) setRefCode(storedReferralCode());
  }, [initial.termsAccepted]);
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
    if (!acceptTerms || !acceptAge)
      return setError("Devam etmek için iki onayı da işaretlemelisin.");

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
          ...(initial.termsAccepted
            ? {}
            : { terms_accepted_at: new Date().toISOString() }),
        })
        .eq("id", userId);
      if (upErr) throw new Error(upErr.message);

      // İlk profil tamamlamada davet kodu (Google ile kaydolanlar için); hata kaydı engellemez
      if (!initial.termsAccepted && refCode.length === 8) {
        const { data: r } = await supabase.rpc("apply_referral_code", { code: refCode });
        if (r === "not_found") throw new Error("Davet kodu bulunamadı. Kontrol et ya da boş bırak.");
        localStorage.removeItem("notvia_ref");
      }

      router.push(safeNext(next));
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

      <Combobox
        icon={<Buildings size={18} weight="duotone" />}
        placeholder="Üniversiteni seç"
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

      {!isNewUni && (
        <Combobox
          icon={<GraduationCap size={18} weight="duotone" />}
          placeholder={universityId ? "Bölümünü seç" : "Önce üniversite seç"}
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

      <div>
        <p className="mb-2 text-sm text-muted">Sınıfın</p>
        <div className="flex flex-wrap gap-2">
          {CLASS_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClassYear(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                classYear === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {!initial.termsAccepted && (
        <input
          value={refCode}
          onChange={(e) => setRefCode(cleanReferralCode(e.target.value))}
          autoComplete="off"
          placeholder="Davet kodu (opsiyonel, ör. 5164375E)"
          className={`${inputClass} font-mono tracking-wider`}
        />
      )}

      {!initial.termsAccepted && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm text-foreground">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              <Link href="/terms" target="_blank" className="text-primary hover:underline">
                Kullanım Şartları
              </Link>{" "}
              ve{" "}
              <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                Gizlilik Politikası
              </Link>
              &apos;nı okudum, kabul ediyorum.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptAge}
              onChange={(e) => setAcceptAge(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span>18 yaşından büyüğüm.</span>
          </label>
        </div>
      )}

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
