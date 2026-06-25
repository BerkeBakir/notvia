import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NoteCard } from "@/components/notes/NoteCard";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: "🏫",
    title: "Üniversiteye göre keşfet",
    desc: "Üniversite → bölüm → ders hiyerarşisinde tam sana uygun notları bul.",
  },
  {
    icon: "📄",
    title: "PDF not yükle & indir",
    desc: "Ders notlarını ve geçmiş sınav sorularını PDF olarak paylaş, indir.",
  },
  {
    icon: "🔔",
    title: "Ders bildirimleri",
    desc: "Takip ettiğin derse yeni içerik eklenince e-posta ile haberdar ol.",
  },
  {
    icon: "✨",
    title: "AI not özeti",
    desc: "Pro üyeler yüklenen notların yapay zeka özetine saniyeler içinde ulaşır.",
  },
  {
    icon: "♥",
    title: "Beğeni & en iyi notlar",
    desc: "En çok beğenilen notlar öne çıkar; kaliteli içerik kaybolmaz.",
  },
  {
    icon: "🎓",
    title: "Topluluk katkılı",
    desc: "Üniversite, bölüm ve dersleri öğrenciler ekler; içerik birlikte büyür.",
  },
];

const STEPS = [
  { n: "1", title: "Profilini oluştur", desc: "Üniversite, bölüm ve sınıfını seç." },
  { n: "2", title: "Dersini bul", desc: "Aradığın yoksa sen ekle, topluluk doğrulasın." },
  { n: "3", title: "Paylaş & indir", desc: "Notunu yükle, başkalarının notlarına ulaş." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [uni, courses, notes, trendingRes] = await Promise.all([
    supabase.from("universities").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase
      .from("notes")
      .select("*")
      .order("likes", { ascending: false })
      .limit(6),
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
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-12 text-center sm:pt-28">
          <span className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted">
            🎓 {uni.count ?? 0}+ üniversite · topluluk katkılı
          </span>
          <h1 className="mt-6 font-heading text-5xl font-bold leading-tight text-foreground sm:text-6xl">
            Notlarını paylaş,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              sınavlara birlikte hazırlan
            </span>
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
              href="/login"
              className="rounded-full border border-border px-7 py-3 font-medium text-foreground hover:border-primary hover:text-primary"
            >
              Ücretsiz Kaydol
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid w-full grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="font-heading text-3xl font-bold text-foreground">
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
          <h2 className="font-heading text-2xl font-bold text-foreground">
            🔥 Popüler Notlar
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
        <h2 className="text-center font-heading text-3xl font-bold text-foreground">
          Neler sunuyoruz?
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-heading text-lg text-card-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
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
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-10 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Hazır mısın?
          </h2>
          <p className="mt-3 text-muted">
            Birkaç dakikada profilini oluştur, ilk notunu paylaş.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground hover:opacity-90"
          >
            Hemen Başla
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
