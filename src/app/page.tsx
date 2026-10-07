import Link from "next/link";
import {
  Buildings,
  FileArrowDown,
  BellSimple,
  TextAlignLeft,
  Star,
  UsersThree,
  GraduationCap,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NoteCard } from "@/components/notes/NoteCard";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

const FEATURES = [
  {
    Icon: Buildings,
    title: "Üniversiteye göre keşfet",
    desc: "Üniversite → bölüm → ders hiyerarşisinde tam sana uygun notları bul.",
    span: "lg:col-span-3",
  },
  {
    Icon: FileArrowDown,
    title: "PDF not yükle & indir",
    desc: "Ders notlarını ve geçmiş sınav sorularını PDF olarak paylaş, indir.",
    span: "lg:col-span-3",
  },
  {
    Icon: BellSimple,
    title: "Ders bildirimleri",
    desc: "Takip ettiğin derse yeni içerik eklenince haberdar ol.",
    span: "lg:col-span-2",
  },
  {
    Icon: TextAlignLeft,
    title: "AI not özeti",
    desc: "Pro üyeler, yüklenen notların yapay zeka özetine saniyeler içinde ulaşır.",
    span: "lg:col-span-2",
  },
  {
    Icon: Star,
    title: "Beğeni & en iyi notlar",
    desc: "En çok beğenilen notlar öne çıkar; kaliteli içerik kaybolmaz.",
    span: "lg:col-span-2",
  },
  {
    Icon: UsersThree,
    title: "Topluluk katkılı",
    desc: "Üniversite, bölüm ve dersleri öğrenciler ekler; içerik birlikte büyür.",
    span: "lg:col-span-6",
  },
];

const STEPS = [
  { n: "1", title: "Profilini oluştur", desc: "Üniversite, bölüm ve sınıfını seç." },
  { n: "2", title: "Dersini bul", desc: "Aradığın yoksa sen ekle, topluluk doğrulasın." },
  { n: "3", title: "Paylaş & indir", desc: "Notunu yükle, başkalarının notlarına ulaş." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [uni, courses, notes, trendingRes, user] = await Promise.all([
    supabase.from("universities").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase
      .from("notes")
      .select("*")
      .order("likes", { ascending: false })
      .limit(6),
    getCurrentUser(),
  ]);

  const trending = (trendingRes.data ?? []).map(mapNoteRow);

  const stats = [
    { value: `${uni.count ?? 0}`, label: "Üniversite" },
    { value: `${courses.count ?? 0}`, label: "Ders" },
    { value: `${notes.count ?? 0}`, label: "Paylaşılan içerik" },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="animate-fade-up mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-12 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted">
            <GraduationCap size={16} weight="duotone" className="text-primary" />
            {uni.count ?? 0}+ üniversite · topluluk katkılı
          </span>
          <h1 className="mt-6 font-heading text-[2rem] font-bold leading-[1.12] tracking-tight text-foreground sm:text-6xl sm:leading-[1.05]">
            Notlarını paylaş,
            <br />
            <span className="relative whitespace-nowrap text-primary">
              sınavlara birlikte
              <svg
                aria-hidden="true"
                viewBox="0 0 300 12"
                className="absolute -bottom-1 left-0 h-[0.4em] w-full text-primary/40"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9 Q 75 2 150 6 T 298 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            hazırlan
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Üniversite, bölüm ve ders bazında ders notları ve geçmiş sınav
            sorularına ulaş. Aradığın yoksa sen ekle.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/notes"
              className="rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground hover:opacity-90"
            >
              Keşfetmeye Başla
            </Link>
            <Link
              href={user ? "/notes/upload" : "/login"}
              className="rounded-full border border-border px-7 py-3 font-medium text-foreground hover:border-primary hover:text-primary"
            >
              {user ? "Not Yükle" : "Ücretsiz Kaydol"}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid w-full grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="font-heading text-3xl font-bold tabular-nums text-foreground">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="inline-flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-foreground">
            <TrendUp size={24} weight="duotone" className="text-primary" />
            Popüler Notlar
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Neler sunuyoruz?
        </h2>
        <p className="mt-2 max-w-md text-muted">
          Notvia&apos;yı öğrenciler için işe yarar kılan şeyler.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 ${f.span}`}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <f.Icon size={22} weight="duotone" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-lg text-card-foreground">
                {f.title}
              </h3>
              <p className="mt-2 max-w-prose text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="text-center font-heading text-3xl font-bold text-foreground">
          Nasıl çalışır?
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground">
                {s.n}
              </div>
              <h3 className="mt-4 font-heading text-lg text-foreground">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[radial-gradient(120%_120%_at_0%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_55%)] bg-card p-10 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">
            {user ? "Sınava mı çalışıyorsun?" : "Hazır mısın?"}
          </h2>
          <p className="mt-3 text-muted">
            {user
              ? "Notlardan sorularını AI asistana sor, kaynaklı cevap al."
              : "Birkaç dakikada profilini oluştur, ilk notunu paylaş."}
          </p>
          <Link
            href={user ? "/asistan" : "/login"}
            className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground hover:opacity-90"
          >
            {user ? "AI Asistanı Aç" : "Hemen Başla"}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
