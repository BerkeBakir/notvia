import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://notvia.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = ["", "/notes", "/search", "/leaderboard", "/premium", "/terms", "/privacy", "/hakkimizda", "/mesafeli-satis", "/on-bilgilendirme", "/iade"].map(
    (p) => ({ url: `${SITE}${p}`, changeFrequency: "daily", priority: p === "" ? 1 : 0.7 }),
  );

  // Çerezsiz (anon) istemci: sitemap herkese açık veriyi listeler
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const [notes, courses] = await Promise.all([
    supabase.from("notes").select("id,created_at").order("created_at", { ascending: false }).limit(5000),
    supabase.from("courses").select("id,created_at").limit(5000),
  ]);

  return [
    ...statics,
    ...(courses.data ?? []).map((c) => ({
      url: `${SITE}/courses/${c.id}`,
      lastModified: c.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(notes.data ?? []).map((n) => ({
      url: `${SITE}/notes/${n.id}`,
      lastModified: n.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
