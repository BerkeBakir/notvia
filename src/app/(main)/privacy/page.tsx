export const metadata = { title: "Gizlilik Politikası" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed text-muted">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Gizlilik Politikası (KVKK)
      </h1>
      <p className="text-xs">Son güncelleme: 2026</p>

      <p>
        Notvia (&quot;Platform&quot;) olarak kişisel verilerinin gizliliğine önem
        veriyoruz. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (KVKK) kapsamında hangi verileri topladığımızı ve nasıl kullandığımızı
        açıklar.
      </p>

      <h2 className="font-heading text-lg text-foreground">Toplanan veriler</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Hesap bilgileri: ad soyad, e-posta, üniversite, bölüm, sınıf</li>
        <li>İçerik: yüklediğin notlar, yorumlar, beğeniler, favoriler</li>
        <li>Teknik: oturum bilgisi, kullanım istatistikleri</li>
      </ul>

      <h2 className="font-heading text-lg text-foreground">Kullanım amacı</h2>
      <p>
        Veriler; hesabının yönetimi, içeriklerin ilgili bölüm/derse eşlenmesi,
        bildirimler ve platform güvenliği için kullanılır. Verilerin üçüncü
        taraflarla pazarlama amacıyla paylaşılmaz.
      </p>

      <h2 className="font-heading text-lg text-foreground">Hizmet sağlayıcılar</h2>
      <p>
        Altyapı için Supabase (veritabanı/kimlik), Vercel (barındırma), Brevo
        (e-posta) ve Google Gemini (AI özet) kullanılır. Bu sağlayıcılar yalnızca
        hizmetin gerektirdiği veriyi işler.
      </p>

      <h2 className="font-heading text-lg text-foreground">Haklarınız</h2>
      <p>
        KVKK kapsamında verilerine erişme, düzeltme ve silinmesini talep etme
        hakkına sahipsin. Hesabını ve verilerini silmek için bizimle iletişime
        geçebilirsin.
      </p>

      <p className="rounded-lg border border-border bg-card p-4 text-xs">
        Not: Bu metin bir örnek şablondur; yayına almadan önce bir hukuk
        danışmanınca gözden geçirilmesi önerilir.
      </p>
    </div>
  );
}
