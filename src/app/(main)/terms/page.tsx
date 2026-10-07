export const metadata = { title: "Kullanım Şartları" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed text-muted">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Kullanım Şartları
      </h1>
      <p className="text-xs">Son güncelleme: 2026</p>

      <p>
        Notvia&apos;yı kullanarak aşağıdaki şartları kabul etmiş olursun.
      </p>

      <h2 className="font-heading text-lg text-foreground">1. İçerik ve telif</h2>
      <p>
        Yüklediğin içeriğin sana ait olduğunu veya paylaşım hakkına sahip
        olduğunu beyan edersin. Telif hakkı ihlali içeren içerik yüklemek
        yasaktır ve şikayet üzerine kaldırılır.
      </p>

      <h2 className="font-heading text-lg text-foreground">2. Topluluk kuralları</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Spam, reklam veya alakasız içerik paylaşma</li>
        <li>Başkalarına saygılı ol; hakaret ve taciz yasaktır</li>
        <li>İçerikleri doğru derse/bölüme yükle</li>
      </ul>

      <h2 className="font-heading text-lg text-foreground">3. Sorumluluk</h2>
      <p>
        Platform, kullanıcılar tarafından paylaşılan içeriğin doğruluğunu
        garanti etmez. İçerikler eğitim amaçlıdır. Platform hizmeti &quot;olduğu
        gibi&quot; sunulur.
      </p>

      <h2 className="font-heading text-lg text-foreground">4. Hesap</h2>
      <p>
        Notvia&apos;yı kullanmak için 18 yaşını doldurmuş olman gerekir. Hesap
        oluşturarak 18 yaşından büyük olduğunu beyan edersin.
      </p>
      <p>
        Kurallara aykırı davranan hesaplar askıya alınabilir veya silinebilir.
        Hesabını istediğin zaman kapatabilirsin.
      </p>

      <h2 className="font-heading text-lg text-foreground">5. Üyelik & ödeme</h2>
      <p>
        Premium/Pro üyelikler isteğe bağlıdır. Ücretsiz plan her zaman
        kullanılabilir. (Ödeme entegrasyonu şu an demo aşamasındadır.)
      </p>

      <p className="rounded-lg border border-border bg-card p-4 text-xs">
        Not: Bu metin bir örnek şablondur; yayına almadan önce bir hukuk
        danışmanınca gözden geçirilmesi önerilir.
      </p>
    </div>
  );
}
