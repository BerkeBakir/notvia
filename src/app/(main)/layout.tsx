import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { FloatingAssistant } from "@/components/ai/FloatingAssistant";
import { StreakPing } from "@/components/StreakPing";
import { FeedbackBubble } from "@/components/FeedbackBubble";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, isProfileComplete } from "@/lib/supabase/auth";

// Profil eksikken de açılabilen sayfalar
const PROFILE_EXEMPT = ["/profile/edit", "/terms", "/privacy"];

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user && !isProfileComplete(user)) {
    const path = (await headers()).get("x-pathname") ?? "";
    if (!PROFILE_EXEMPT.some((p) => path.startsWith(p))) {
      redirect(`/profile/edit?next=${encodeURIComponent(path || "/notes")}`);
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <ReferralCapture />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
      <FloatingAssistant loggedIn={!!user} />
      <FeedbackBubble loggedIn={!!user} />
      {user && <StreakPing />}
    </div>
  );
}
