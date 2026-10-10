// Satıcı (hizmet sağlayıcı) bilgileri: yasal sayfaların hepsi buradan okur.
// Şirket kurulunca boş alanları doldur; boş alanlar sayfalarda "şirket kuruluşunun ardından eklenecektir" olarak görünür.
export const SELLER = {
  brand: "Notvia",
  /** Şahıs şirketinde: Ad Soyad (ticari unvan varsa o) */
  title: "",
  taxOffice: "",
  taxNumber: "",
  mersis: "",
  address: "",
  phone: "",
  email: "info@notvia.app",
  kep: "",
  website: "https://notvia.app",
};

export const PENDING = "Şirket kuruluşunun ardından eklenecektir.";

export function sellerField(v: string) {
  return v.trim() || PENDING;
}

export const LEGAL_UPDATED = "Ekim 2026";
