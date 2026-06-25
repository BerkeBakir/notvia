import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReferralCapture } from "@/components/referral/ReferralCapture";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ReferralCapture />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
