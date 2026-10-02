import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "Notvia ders notu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("title,type")
    .eq("id", params.id)
    .maybeSingle();

  const title = note?.title ?? "Ders Notu";
  const kind = note?.type === "exam" ? "Sınav Sorusu" : "Ders Notu";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#10b981",
              color: "#0a0a0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              fontWeight: 700,
            }}
          >
            N
          </div>
          <span style={{ color: "#fafafa", fontSize: "32px", fontWeight: 700 }}>
            Notvia
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <span
            style={{
              color: "#34d399",
              fontSize: "28px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {kind}
          </span>
          <span
            style={{
              color: "#fafafa",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {title.length > 90 ? title.slice(0, 87) + "…" : title}
          </span>
        </div>

        <span style={{ color: "#71717a", fontSize: "26px" }}>
          notvia.vercel.app · topluluk katkılı not paylaşımı
        </span>
      </div>
    ),
    size,
  );
}
