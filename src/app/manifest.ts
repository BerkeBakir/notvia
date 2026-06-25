import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Notvia — Not & Sınav Paylaşımı",
    short_name: "Notvia",
    description:
      "Üniversite öğrencileri için not ve sınav sorusu paylaşım platformu",
    start_url: "/",
    display: "standalone",
    background_color: "#070d1f",
    theme_color: "#2dd4cf",
    lang: "tr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
