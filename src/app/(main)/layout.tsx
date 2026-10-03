import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { FloatingAssistant } from "@/components/ai/FloatingAssistant";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <ReferralCapture />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
      <FloatingAssistant loggedIn={!!user} />
    </div>
  );
}
