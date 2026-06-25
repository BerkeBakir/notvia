import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "@/styles/globals.css";

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notvia — Not & Sınav Paylaşım Platformu",
  description:
    "Üniversite öğrencileri için not ve sınav sorusu paylaşım platformu",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Notvia" },
};

export const viewport: Viewport = {
  themeColor: "#2dd4cf",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${sora.variable}`}
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
      </body>
    </html>
  );
}
