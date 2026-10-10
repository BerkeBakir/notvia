import { LEGAL_UPDATED, SELLER, sellerField } from "@/lib/legal";

/** Yasal sayfaların ortak çerçevesi (Kullanım Şartları ile aynı tipografi). */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed text-muted [&_h2]:font-heading [&_h2]:text-lg [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_b]:text-foreground">
      <h1 className="font-heading text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-xs">Son güncelleme: {LEGAL_UPDATED}</p>
      {children}
    </div>
  );
}

/** Satıcı bilgileri tablosu (mesafeli satış, ön bilgilendirme ve iletişim sayfalarında). */
export function SellerInfo() {
  const rows: [string, string][] = [
    ["Unvan / Ad Soyad", sellerField(SELLER.title)],
    ["Marka", SELLER.brand],
    ["Vergi dairesi / No", SELLER.taxNumber ? `${SELLER.taxOffice} / ${SELLER.taxNumber}` : sellerField("")],
    ["MERSİS no", sellerField(SELLER.mersis)],
    ["Adres", sellerField(SELLER.address)],
    ["Telefon", sellerField(SELLER.phone)],
    ["E-posta", SELLER.email],
    ["KEP adresi", sellerField(SELLER.kep)],
    ["Web sitesi", SELLER.website],
  ];
  return (
    <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 rounded-xl border border-border bg-card p-4">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
