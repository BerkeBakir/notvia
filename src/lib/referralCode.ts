/** Kısa davet kodu: kullanıcı id'sinin ilk 8 hex hanesi (veritabanındaki referral_code ile aynı). */
export function referralCode(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Linkten (?ref=) gelip tarayıcıda saklanan davetin kodu. */
export function storedReferralCode(): string {
  if (typeof window === "undefined") return "";
  const ref = localStorage.getItem("notvia_ref");
  return ref ? referralCode(ref) : "";
}

export function cleanReferralCode(raw: string): string {
  return raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 8).toUpperCase();
}
