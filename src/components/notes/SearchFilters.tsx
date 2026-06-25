"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
        <select
          value={universityId}
          onChange={(e) => {
            setUniversityId(e.target.value);
            setDepartmentId("");
          }}
          className={inputClass}
        >
          <option value="">Tüm üniversiteler</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          disabled={!universityId}
          className={inputClass}
        >
          <option value="">Tüm bölümler</option>
          {availableDepartments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="likes">En beğenilen</option>
          <option value="created">En yeni</option>
          <option value="downloads">En çok indirilen</option>
        </select>
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
