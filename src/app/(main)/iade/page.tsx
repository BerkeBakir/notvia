import { LegalPage } from "@/components/legal/LegalPage";
import { SELLER } from "@/lib/legal";

export const metadata = { title: "Teslimat, İptal ve İade Koşulları" };

export default function RefundPage() {
  return (
    <LegalPage title="Teslimat, İptal ve İade Koşulları">
      <h2>1. Hizmetin niteliği ve teslimat</h2>
      <p>
        Notvia Premium ve Pro üyelikleri, fiziksel teslimatı olmayan dijital aboneliklerdir. Ödeme onaylandığı anda
        üyelik hesabına tanımlanır ve ek özellikler <b>anında</b> kullanıma açılır. Kargo veya teslimat ücreti yoktur.
      </p>

      <h2>2. Abonelik ve yenileme</h2>
      <ul>
        <li>Abonelikler seçilen döneme göre (aylık veya yıllık) her dönem sonunda otomatik yenilenir.</li>
        <li>Yenileme ücreti, kayıtlı kartından dönem başında tahsil edilir.</li>
        <li>Fiyat değişiklikleri, yürürlüğe girmeden en az 14 gün önce e-postayla bildirilir ve sonraki dönemden itibaren uygulanır.</li>
      </ul>

      <h2>3. İptal</h2>
      <p>
        Aboneliğini dilediğin zaman <b>Hesap ayarları → Abonelik → Aboneliği iptal et</b> adımlarıyla ya da{" "}
        {SELLER.email} adresine yazarak iptal edebilirsin. İptal sonrasında bir sonraki dönem için ücret alınmaz. İptal
        anında ücretli özellikler kapanır; içinde bulunulan dönemin kalan kısmı için kısmi iade yapılmaz (aşağıdaki
        istisnalar hariç).
      </p>

      <h2>4. Cayma hakkı</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin (ğ) bendi uyarınca, elektronik ortamda anında ifa
        edilen hizmetlerde tüketicinin onayıyla ifaya başlanmışsa cayma hakkı kullanılamaz. Ödeme sırasında bu konudaki
        onayın alınır.
      </p>
      <p>
        Buna rağmen, öğrenci dostu bir uygulama olarak: <b>ilk kez abone olduysan ve ödeme tarihinden itibaren 7 gün
        içinde</b> talep edersen, ücretin tamamı iade edilir. Bu hak her kullanıcı için bir kez geçerlidir.
      </p>

      <h2>5. İade süreci</h2>
      <ul>
        <li>İade talepleri {SELLER.email} adresine, hesabına kayıtlı e-postadan gönderilir.</li>
        <li>Onaylanan iadeler en geç 14 gün içinde, ödemenin yapıldığı karta iade edilir.</li>
        <li>İadenin kart ekstresine yansıma süresi bankana bağlıdır.</li>
        <li>Hatalı veya mükerrer tahsilatlar, süre şartı aranmaksızın tamamen iade edilir.</li>
      </ul>

      <h2>6. Hizmetin kullanılamaması</h2>
      <p>
        Notvia kaynaklı bir sorun nedeniyle ücretli özellikler 72 saatten uzun süre kesintisiz kullanılamazsa, kesinti
        süresi kadar üyelik uzatılır veya talep halinde orantılı iade yapılır.
      </p>
    </LegalPage>
  );
}
