import { Calculator } from "@phosphor-icons/react/dist/ssr";
import { GradeCalculator } from "@/components/tools/GradeCalculator";

export const metadata = {
  title: "Not hesaplayıcı",
  description: "Finalden kaç almalıyım? Bağıl not / çan eğrisi ve AGNO hesaplayıcı.",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          <Calculator size={30} weight="duotone" className="text-primary" /> Not hesaplayıcı
        </h1>
        <p className="mt-1 text-sm text-muted">
          Finalden kaç alman gerektiğini, bağıl değerlendirmede nerede durduğunu ve ortalamanı hesapla.
        </p>
      </div>
      <GradeCalculator />
    </div>
  );
}
