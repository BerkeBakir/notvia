import Link from "next/link";
import { LegalPage, SellerInfo } from "@/components/legal/LegalPage";
import { PlanPriceTable } from "@/components/legal/PlanPriceTable";

export const metadata = { title: "Mesafeli Satış Sözleşmesi" };

export default function DistanceSalesPage() {
  return (
    <LegalPage title="Mesafeli Satış Sözleşmesi">
      <h2>Madde 1 — Taraflar</h2>
      <p>
        <b>Satıcı:</b>
      </p>
      <SellerInfo />
      <p>
        <b>Alıcı:</b> notvia.app üzerinde abonelik satın alan, ödeme sırasında ad, soyad, e-posta, telefon ve fatura
        adresi bilgilerini beyan eden kullanıcı.
      </p>

      <h2>Madde 2 — Konu</h2>
      <p>
        İşbu sözleşmenin konusu, Alıcı&apos;nın notvia.app üzerinden elektronik ortamda satın aldığı Premium veya Pro
        dijital abonelik hizmetinin satışı ve ifasına ilişkin, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
        Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerinin belirlenmesidir.
      </p>

      <h2>Madde 3 — Hizmet ve bedel</h2>
      <PlanPriceTable />
      <p>
        Fiyatlara KDV dahildir. Alıcı&apos;nın seçtiği plan ve dönem, ödeme sayfasında ve ödeme sonrası gönderilen
        e-postada belirtilir.
      </p>

      <h2>Madde 4 — Ödeme ve yenileme</h2>
      <ul>
        <li>Ödeme, iyzico ödeme altyapısı üzerinden kredi veya banka kartıyla yapılır.</li>
        <li>
          Abonelik, Alıcı iptal edene kadar seçilen dönem sonunda aynı bedelle otomatik olarak yenilenir ve bedel kayıtlı
          karttan tahsil edilir.
        </li>
        <li>Fiyat değişiklikleri en az 14 gün önceden e-postayla bildirilir ve sonraki dönemden itibaren geçerlidir.</li>
      </ul>

      <h2>Madde 5 — İfa</h2>
      <p>
        Hizmet, ödemenin onaylanmasıyla Alıcı&apos;nın hesabına anında tanımlanır. Fiziksel teslimat yoktur.
      </p>

      <h2>Madde 6 — Cayma hakkı</h2>
      <p>
        Alıcı, hizmetin elektronik ortamda anında ifasına onay verdiğini ve bu nedenle Mesafeli Sözleşmeler
        Yönetmeliği md. 15/1-ğ uyarınca cayma hakkının bulunmadığını kabul eder. Ödenen abonelik bedelleri, hatalı veya mükerrer
        tahsilatlar ile Satıcı kaynaklı hizmet kesintileri dışında iade edilmez.
      </p>

      <h2>Madde 7 — İptal</h2>
      <p>
        Alıcı aboneliğini dilediği zaman Hesap ayarları üzerinden veya e-postayla iptal edebilir. İptal ile birlikte
        sonraki dönemler için ücret alınmaz. Ayrıntılar{" "}
        <Link href="/iade" className="text-primary hover:underline">
          Teslimat, İptal ve İade Koşulları
        </Link>
        &apos;nda yer alır.
      </p>

      <h2>Madde 8 — Tarafların yükümlülükleri</h2>
      <ul>
        <li>Satıcı, hizmeti sözleşmede ve sitede belirtilen niteliklere uygun olarak sunmakla yükümlüdür.</li>
        <li>
          Alıcı, hesabını üçüncü kişilerle paylaşmamayı ve platformu{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Kullanım Şartları
          </Link>
          &apos;na uygun kullanmayı kabul eder.
        </li>
        <li>
          Kişisel veriler{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Gizlilik ve KVKK Aydınlatma Metni
          </Link>{" "}
          kapsamında işlenir.
        </li>
      </ul>

      <h2>Madde 9 — Uyuşmazlıklar</h2>
      <p>
        İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığınca ilan edilen parasal sınırlar dahilinde Tüketici
        Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>Madde 10 — Yürürlük</h2>
      <p>
        Alıcı, ödeme sayfasında bu sözleşmeyi ve Ön Bilgilendirme Formu&apos;nu okuduğunu ve kabul ettiğini
        onayladığı anda sözleşme kurulmuş sayılır. Sözleşmenin bir örneği Alıcı&apos;nın e-posta adresine gönderilir.
      </p>
    </LegalPage>
  );
}
