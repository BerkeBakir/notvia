import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "@/styles/globals.css";

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://notvia.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Notvia — Not & Sınav Paylaşım Platformu",
    template: "%s — Notvia",
  },
  description:
    "Üniversite öğrencileri için not ve sınav sorusu paylaşım platformu. Üniversite, bölüm ve ders bazında ders notlarına ve geçmiş sınav sorularına ulaş.",
  keywords: [
    "ders notu",
    "sınav soruları",
    "üniversite",
    "not paylaşımı",
    "çıkmış sorular",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Notvia" },
  openGraph: {
    title: "Notvia — Not & Sınav Paylaşım Platformu",
    description:
      "Üniversite öğrencileri için topluluk katkılı not & sınav paylaşım platformu.",
    url: SITE_URL,
    siteName: "Notvia",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Notvia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notvia",
    description:
      "Üniversite öğrencileri için not & sınav paylaşım platformu.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <body>
        {adsenseClient && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
