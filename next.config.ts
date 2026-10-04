import type { NextConfig } from "next";

// İçerik Güvenlik Politikası (XSS/enjeksiyon savunması).
// Next (inline hydration) + Supabase + AdSense + Vercel Analytics + Google OAuth/avatar izinli.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.googlesyndication.com https://*.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://accounts.google.com https://*.googlesyndication.com https://td.doubleclick.net",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

// Güvenlik HTTP başlıkları (tüm yollara uygulanır)
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS zorunlu kıl (2 yıl)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Clickjacking koruması (başka sitede iframe'e gömülemez)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // MIME-sniffing koruması
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer bilgisini sınırla
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Gereksiz tarayıcı API'lerini kapat
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
