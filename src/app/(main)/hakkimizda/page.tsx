import Link from "next/link";
import { LegalPage, SellerInfo } from "@/components/legal/LegalPage";
import { SELLER } from "@/lib/legal";

export const metadata = { title: "Hakkımızda ve İletişim" };

export default function AboutPage() {
  return (
    <LegalPage title="Hakkımızda ve İletişim">
      <p>
        Notvia, Türkiye&apos;deki üniversite öğrencilerinin ders notlarını ve çıkmış sınav sorularını üniversite,
        bölüm ve ders bazında paylaştığı bir topluluk platformudur. Platforma yüklenen notlar üzerinden çalışan yapay
        zekâ destekli çalışma araçları (özet, soru, bilgi kartı, notlara dayalı soru-cevap) sunar.
      </p>
      <p>
        Temel özellikler ücretsizdir. Premium ve Pro üyelikler, reklamsız kullanım, sınırsız indirme ve daha fazla
        yapay zekâ kullanımı gibi ek özellikler sağlayan aylık veya yıllık dijital aboneliklerdir. Ayrıntılar için{" "}
        <Link href="/premium" className="text-primary hover:underline">
          Premium
        </Link>{" "}
        sayfasına bakabilirsin.
      </p>

      <h2>İletişim</h2>
      <p>
        Soru, öneri, telif hakkı bildirimi ve abonelik talepleri için{" "}
        <a href={`mailto:${SELLER.email}`} className="text-primary hover:underline">
          {SELLER.email}
        </a>{" "}
        adresine yazabilirsin. Sitedeki geri bildirim balonunu da kullanabilirsin. Talepler en geç 3 iş günü içinde
        yanıtlanır.
      </p>
      <SellerInfo />

      <h2>Yasal metinler</h2>
      <ul>
        <li>
          <Link href="/terms" className="text-primary hover:underline">Kullanım Şartları</Link>
        </li>
        <li>
          <Link href="/privacy" className="text-primary hover:underline">Gizlilik ve KVKK Aydınlatma Metni</Link>
        </li>
        <li>
          <Link href="/mesafeli-satis" className="text-primary hover:underline">Mesafeli Satış Sözleşmesi</Link>
        </li>
        <li>
          <Link href="/on-bilgilendirme" className="text-primary hover:underline">Ön Bilgilendirme Formu</Link>
        </li>
        <li>
          <Link href="/iade" className="text-primary hover:underline">Teslimat, İptal ve İade Koşulları</Link>
        </li>
      </ul>
    </LegalPage>
  );
}
