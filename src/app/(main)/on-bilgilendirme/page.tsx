import Link from "next/link";
import { LegalPage, SellerInfo } from "@/components/legal/LegalPage";
import { PlanPriceTable } from "@/components/legal/PlanPriceTable";

export const metadata = { title: "Ön Bilgilendirme Formu" };

export default function PreInfoPage() {
  return (
    <LegalPage title="Ön Bilgilendirme Formu">
      <p>
        Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca,
        sözleşme kurulmadan önce tüketiciyi bilgilendirmek amacıyla hazırlanmıştır.
      </p>

      <h2>1. Satıcı bilgileri</h2>
      <SellerInfo />

      <h2>2. Hizmetin temel nitelikleri</h2>
      <p>
        Notvia Premium ve Pro, notvia.app üzerinde sunulan dijital abonelik hizmetleridir. Premium; reklamsız kullanım,
        sınırsız not indirme ve günlük 50 yapay zekâ sorusu; Pro ise bunlara ek olarak sınırsız yapay zekâ çalışma
        araçları sağlar. Güncel özellik listesi{" "}
        <Link href="/premium" className="text-primary hover:underline">
          Premium
        </Link>{" "}
        sayfasındadır.
      </p>

      <h2>3. Fiyat ve ödeme</h2>
      <PlanPriceTable />
      <ul>
        <li>Fiyatlara KDV dahildir. Ek vergi, kargo veya teslimat ücreti yoktur.</li>
        <li>Ödeme, iyzico altyapısı üzerinden kredi veya banka kartıyla alınır. Kart bilgileri Notvia tarafından saklanmaz.</li>
        <li>Abonelik, seçilen dönem (aylık/yıllık) sonunda aynı tutarla otomatik yenilenir.</li>
      </ul>

      <h2>4. İfa (teslimat)</h2>
      <p>Hizmet, ödemenin onaylanmasının ardından hesabına anında tanımlanır ve elektronik ortamda ifa edilir.</p>

      <h2>5. Cayma hakkı</h2>
      <p>
        Elektronik ortamda anında ifa edilen hizmetlerde, ifaya tüketicinin onayıyla başlanması halinde cayma hakkı
        kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md. 15/1-ğ). Bununla birlikte ilk aboneliğinde ödeme tarihinden
        itibaren 7 gün içinde talep etmen halinde ücretin tamamı iade edilir. Ayrıntılar:{" "}
        <Link href="/iade" className="text-primary hover:underline">
          Teslimat, İptal ve İade Koşulları
        </Link>
        .
      </p>

      <h2>6. Şikayet ve itiraz</h2>
      <p>
        Şikayetlerini öncelikle bize iletebilirsin. Ayrıca, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar
        dahilinde ikametgâhının bulunduğu veya hizmeti satın aldığın yerdeki Tüketici Hakem Heyetine ya da Tüketici
        Mahkemesine başvurabilirsin.
      </p>
    </LegalPage>
  );
}
