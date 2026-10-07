"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";

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

  const inputClass =
    "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary";

  return (
    <form onSubmit={search} className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Not başlığında ara..."
        className={inputClass}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Combobox
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
          placeholder={universityId ? "Tüm bölümler" : "Önce üniversite seç"}
          searchPlaceholder="Bölüm ara..."
          clearable
          disabled={!universityId}
          options={availableDepartments.map((d) => ({ value: d.id, label: d.name }))}
          value={departmentId}
          onChange={setDepartmentId}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {[
            ["likes", "En beğenilen"],
            ["created", "En yeni"],
            ["downloads", "En çok indirilen"],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setSort(v)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                sort === v ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Ara
        </button>
      </div>
    </form>
  );
}
