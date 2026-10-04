import type { NextConfig } from "next";

// Güvenlik HTTP başlıkları (tüm yollara uygulanır)
const securityHeaders = [
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
