"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";
import { Buildings, GraduationCap, MagnifyingGlass } from "@phosphor-icons/react";

interface University {
  id: string;
  name: string;
}
interface Department {
  id: string;
  name: string;
  university_id: string;
}

export function SearchFilters({
  universities,
  departments,
  initialQuery,
  initialUniversity,
  initialDepartment,
  initialSort,
}: {
  universities: University[];
  departments: Department[];
  initialQuery: string;
  initialUniversity: string;
  initialDepartment: string;
  initialSort: string;
}) {
  const router = useRouter();
  const [universityId, setUniversityId] = useState(initialUniversity);
  const [departmentId, setDepartmentId] = useState(initialDepartment);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort || "likes");

  const availableDepartments = useMemo(
    () => departments.filter((d) => d.university_id === universityId),
    [departments, universityId],
  );

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (departmentId) params.set("dep", departmentId);
    if (sort) params.set("sort", sort);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={search}
      className="space-y-4 rounded-2xl border border-border bg-card/50 p-5"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Not başlığında ara (ör. vize, veri yapıları, 2024)"
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Ara
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Combobox
          icon={<Buildings size={18} weight="duotone" />}
          placeholder="Tüm üniversiteler"
          searchPlaceholder="Üniversite ara..."
          clearable
          options={universities.map((u) => ({ value: u.id, label: u.name }))}
          value={universityId}
          onChange={(v) => {
            setUniversityId(v);
            setDepartmentId("");
          }}
        />
        <Combobox
          icon={<GraduationCap size={18} weight="duotone" />}
          placeholder={universityId ? "Tüm bölümler" : "Önce üniversite seç"}
          searchPlaceholder="Bölüm ara..."
          clearable
          disabled={!universityId}
          options={availableDepartments.map((d) => ({ value: d.id, label: d.name }))}
          value={departmentId}
          onChange={setDepartmentId}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Sırala:</span>
        {[
          ["likes", "En beğenilen"],
          ["created", "En yeni"],
          ["downloads", "En çok indirilen"],
        ].map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setSort(v)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              sort === v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </form>
  );
}
