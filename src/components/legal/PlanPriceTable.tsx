import { PLAN_PRICES_TRY } from "@/lib/payments/config";

/** Yasal metinlerdeki fiyat tablosu: ödeme sayfasıyla aynı kaynaktan okunur. */
export function PlanPriceTable() {
  return (
    <table className="w-full overflow-hidden rounded-xl border border-border text-left">
      <thead className="bg-card text-foreground">
        <tr>
          <th className="px-3 py-2 font-medium">Plan</th>
          <th className="px-3 py-2 font-medium">Aylık</th>
          <th className="px-3 py-2 font-medium">Yıllık</th>
        </tr>
      </thead>
      <tbody>
        {(["premium", "pro"] as const).map((p) => (
          <tr key={p} className="border-t border-border">
            <td className="px-3 py-2 text-foreground">{p === "pro" ? "Pro" : "Premium"}</td>
            <td className="px-3 py-2">{PLAN_PRICES_TRY[p].monthly} ₺</td>
            <td className="px-3 py-2">{PLAN_PRICES_TRY[p].yearly} ₺</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
