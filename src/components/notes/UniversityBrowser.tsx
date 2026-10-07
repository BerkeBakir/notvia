"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Books,
  Buildings,
  CaretRight,
  Fire,
  GraduationCap,
  MagnifyingGlass,
  MapPin,
  Plus,
  Star,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Combobox } from "@/components/ui/Combobox";
import { matchScore } from "@/lib/textMatch";

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

const PAGE = 24;

export function UniversityBrowser({
  universities,
  departments,
  courses,
  noteCounts,
  myUniversityId = null,
}: {
  universities: University[];
  departments: Department[];
  courses: Course[];
  noteCounts: Record<string, number>;
  myUniversityId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  // Sayımlar: ders → bölüm → üniversite
  const stats = useMemo(() => {
    const depNotes: Record<string, number> = {};
    const depCourses: Record<string, number> = {};
    for (const c of courses) {
      depNotes[c.department_id] = (depNotes[c.department_id] ?? 0) + (noteCounts[c.id] ?? 0);
      depCourses[c.department_id] = (depCourses[c.department_id] ?? 0) + 1;
    }
    const uniNotes: Record<string, number> = {};
    const uniCourses: Record<string, number> = {};
    for (const d of departments) {
      uniNotes[d.university_id] = (uniNotes[d.university_id] ?? 0) + (depNotes[d.id] ?? 0);
      uniCourses[d.university_id] = (uniCourses[d.university_id] ?? 0) + (depCourses[d.id] ?? 0);
    }
    return { depNotes, depCourses, uniNotes, uniCourses };
  }, [courses, departments, noteCounts]);

  const cities = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of universities) m.set(u.city, (m.get(u.city) ?? 0) + 1);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "tr"))
      .map(([c, n]) => ({ value: c, label: c, hint: `${n}` }));
  }, [universities]);

  const filtered = useMemo(() => {
    const list = universities
      .filter((u) => !city || u.city === city)
      .map((u) => ({ u, score: matchScore(`${u.name} ${u.city}`, query) }))
      .filter((x) => x.score > 0);
    // Önce kendi üniversiten, sonra içeriği olanlar (not sayısına göre), sonra alfabetik
    list.sort((a, b) => {
      if (a.u.id === myUniversityId) return -1;
      if (b.u.id === myUniversityId) return 1;
      if (b.score !== a.score) return b.score - a.score;
      const na = stats.uniNotes[a.u.id] ?? 0;
      const nb = stats.uniNotes[b.u.id] ?? 0;
      if (nb !== na) return nb - na;
      return a.u.name.localeCompare(b.u.name, "tr");
    });
    return list.map((x) => x.u);
  }, [universities, city, query, myUniversityId, stats]);

  const selectedUni = selected ? universities.find((u) => u.id === selected) : null;

  if (selectedUni) {
    return (
      <UniversityDetail
        uni={selectedUni}
        departments={departments.filter((d) => d.university_id === selectedUni.id)}
        courses={courses}
        noteCounts={noteCounts}
        depNotes={stats.depNotes}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_16rem]">
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Üniversite ara (ör. odtü, boğaziçi, ege)"
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <Combobox
          icon={<MapPin size={18} weight="duotone" />}
          placeholder="Tüm şehirler"
          searchPlaceholder="Şehir ara..."
          clearable
          options={cities}
          value={city}
          onChange={(v) => {
            setCity(v);
            setLimit(PAGE);
          }}
        />
      </div>

      <p className="text-xs text-muted">
        {filtered.length} üniversite · içeriği olanlar üstte
      </p>

      {filtered.length === 0 &&
        (universities.length === 0 ? (
          <EmptyState
            icon="🏫"
            title="Henüz üniversite eklenmemiş"
            description="İlk dersi ekleyerek üniversite ve bölüm hiyerarşisini sen başlat."
            action={{ href: "/courses/new", label: "+ Ders Ekle" }}
          />
        ) : (
          <EmptyState
            icon="🔍"
            title="Sonuç bulunamadı"
            description="Farklı bir arama dene ya da şehir filtresini temizle. Üniversiten yoksa ekleyebilirsin."
            action={{ href: "/courses/new", label: "+ Üniversite / ders ekle" }}
          />
        ))}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, limit).map((u) => {
          const notes = stats.uniNotes[u.id] ?? 0;
          const crs = stats.uniCourses[u.id] ?? 0;
          const mine = u.id === myUniversityId;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setSelected(u.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group flex flex-col rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
                mine ? "border-primary/50 ring-4 ring-primary/10" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    notes ? "bg-primary/15 text-primary" : "bg-border/60 text-muted"
                  }`}
                >
                  <Buildings size={20} weight="duotone" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-medium leading-snug text-card-foreground">{u.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin size={12} /> {u.city}
                  </span>
                </span>
                <CaretRight size={16} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                {mine && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">
                    <Star size={10} weight="fill" /> Senin üniversiten
                  </span>
                )}
                {notes > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{notes} not</span>
                ) : (
                  <span className="rounded-full bg-border/60 px-2 py-0.5 text-muted">Henüz not yok</span>
                )}
                {crs > 0 && <span className="rounded-full bg-border/60 px-2 py-0.5 text-muted">{crs} ders</span>}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="mx-auto block rounded-full border border-border px-6 py-2.5 text-sm text-foreground transition hover:border-primary hover:text-primary"
        >
          Daha fazla göster ({filtered.length - limit} kaldı)
        </button>
      )}
    </div>
  );
}

function UniversityDetail({
  uni,
  departments,
  courses,
  noteCounts,
  depNotes,
  onBack,
}: {
  uni: University;
  departments: Department[];
  courses: Course[];
  noteCounts: Record<string, number>;
  depNotes: Record<string, number>;
  onBack: () => void;
}) {
  const [q, setQ] = useState("");
  const deps = [...departments]
    .map((d) => ({
      d,
      list: courses.filter((c) => c.department_id === d.id),
    }))
    .filter(
      ({ d, list }) => !q || matchScore(d.name, q) > 0 || list.some((c) => matchScore(c.name, q) > 0),
    )
    .sort((a, b) => (depNotes[b.d.id] ?? 0) - (depNotes[a.d.id] ?? 0) || a.d.name.localeCompare(b.d.name, "tr"));

  return (
    <div className="animate-fade-up space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary"
      >
        <ArrowLeft size={16} /> Tüm üniversiteler
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{uni.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin size={14} /> {uni.city}
          </p>
        </div>
        <Link
          href="/courses/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary"
        >
          <Plus size={14} weight="bold" /> Bölüm / ders ekle
        </Link>
      </div>

      {departments.length > 0 && (
        <div className="relative">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bölüm ya da ders ara..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      )}

      {departments.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="Bu üniversitede henüz bölüm yok"
          description="İlk dersi ekleyen sen ol; arkadaşların notlarını paylaşsın."
          action={{ href: "/courses/new", label: "+ Ders Ekle" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {deps.map(({ d, list }) => (
            <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex min-w-0 items-center gap-2 font-medium text-card-foreground">
                  <GraduationCap size={18} weight="duotone" className="shrink-0 text-primary" />
                  <span className="truncate">{d.name}</span>
                </h3>
                <Link
                  href={`/departments/${d.id}`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Fire size={12} weight="fill" /> En beğenilenler
                </Link>
              </div>
              <ul className="mt-3 space-y-1">
                {list.length === 0 && <li className="px-2 py-1 text-sm text-muted">Henüz ders eklenmemiş.</li>}
                {list
                  .filter((c) => !q || matchScore(d.name, q) > 0 || matchScore(c.name, q) > 0)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/courses/${c.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Books size={14} className="shrink-0 text-muted" />
                          <span className="truncate">
                            {c.name}
                            {c.instructor && <span className="ml-1.5 text-muted">· {c.instructor}</span>}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                            noteCounts[c.id] ? "bg-primary/10 text-primary" : "bg-border/60 text-muted"
                          }`}
                        >
                          {noteCounts[c.id] ?? 0} not
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
