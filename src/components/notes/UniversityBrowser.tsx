"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
interface Course {
  id: string;
  name: string;
  instructor: string | null;
  department_id: string;
}

export function UniversityBrowser({
  universities,
  departments,
  courses,
  noteCounts,
}: {
  universities: University[];
  departments: Department[];
  courses: Course[];
  noteCounts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLocaleLowerCase("tr").includes(q) ||
        u.city.toLocaleLowerCase("tr").includes(q),
    );
  }, [universities, query]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Üniversite veya şehir ara..."
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
      />

      <p className="text-xs text-muted">{filtered.length} üniversite</p>

      <div className="space-y-3">
        {filtered.map((uni) => {
          const uniDepartments = departments.filter(
            (d) => d.university_id === uni.id,
          );
          return (
            <details
              key={uni.id}
              className="group rounded-2xl border border-border bg-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-heading text-lg text-card-foreground marker:hidden">
                <span>
                  {uni.name}
                  <span className="ml-2 text-sm font-normal text-muted">
                    {uni.city}
                  </span>
                </span>
                <span className="text-muted transition group-open:rotate-180">
                  ▾
                </span>
              </summary>

              <div className="space-y-2 px-5 pb-5">
                {uniDepartments.length === 0 && (
                  <p className="px-2 py-1 text-sm text-muted">
                    Henüz bölüm eklenmemiş.
                  </p>
                )}
                {uniDepartments.map((dep) => {
                  const depCourses = courses.filter(
                    (c) => c.department_id === dep.id,
                  );
                  return (
                    <details
                      key={dep.id}
                      className="rounded-xl border border-border bg-background/40"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 font-medium text-foreground marker:hidden">
                        <span>{dep.name}</span>
                        <Link
                          href={`/departments/${dep.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-normal text-primary hover:underline"
                        >
                          🔥 En beğenilenler →
                        </Link>
                      </summary>
                      <ul className="space-y-1 px-4 pb-3">
                        {depCourses.length === 0 && (
                          <li className="px-2 py-1 text-sm text-muted">
                            Henüz ders eklenmemiş.
                          </li>
                        )}
                        {depCourses.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={`/courses/${c.id}`}
                              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary"
                            >
                              <span>
                                {c.name}
                                {c.instructor && (
                                  <span className="ml-2 text-muted">
                                    · {c.instructor}
                                  </span>
                                )}
                              </span>
                              <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                                {noteCounts[c.id] ?? 0} not
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
