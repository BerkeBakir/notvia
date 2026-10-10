# 🎓 Notvia

**A community-driven academic resource and study platform for university students.**

Notvia enables students to upload, organize, discover, and discuss lecture notes and past-exam PDFs by university, department, and course. It combines Supabase-backed authentication, storage, PostgreSQL (with pgvector), and Row-Level Security with Turkish-aware search, ratings, notifications, gamification, and social features. An AI study companion answers questions grounded in the uploaded notes (RAG), with OCR for scanned PDFs and a multi-provider LLM fallback chain. The platform includes 38 database migrations, three membership tiers, PWA support, and Vercel deployment.

🌐 **Live demo:** [notvia.app](https://notvia.app)

---

## ✨ Features

### Content & discovery
- **Community-driven hierarchy** — university → department → course, all added & maintained by students
- **PDF upload & download** — lecture notes and past exam papers (PDF-only, 40 MB limit), with a download interstitial and real download counter
- **Turkish-aware search** — letter folding (`guvenlik` = `güvenlik`), consonant softening (`güvenlik` ~ `güvenliği`), across title, description and course name; sort by likes / newest / downloads
- **Explore** — university cards (your own first), abbreviation search, city filter, department & course browsing
- **Tags**, **trending** notes and **related notes**
- **Course verification** — community voting (3 confirmations marks a course “verified”)
- **Note requests** (`/istekler`) — request a missing note, upvote others’ requests, fulfil them by uploading

### Social & community
- **Likes / dislikes** with a derived **5-star rating**, **comments**, **saved notes** (`/kaydedilenler`)
- **Friends** (`/arkadaslar`) — follow, activity feed, suggestions, share notes / AI answers with friends
- **Notifications** — in-app bell + email (Brevo) for comments, likes, new notes in followed courses, requests, exams
- **Contribution points, levels & badges**, global and friends **leaderboard**
- **Weekly quests** (`/gorevler`) and a daily **study streak**
- **Referrals** — 8-digit invite code / link, rewarded with Premium (new accounts only)
- **Reporting**, **feedback bubble** and an **admin moderation panel**

### AI study companion
- **Assistant** (`/asistan`) — streaming chat over all notes or a single course, answers cite source notes (RAG on pgvector, HNSW index)
- **Per-note tools** — summary, practice questions, flashcards, quiz, “ask the note”
- **OCR** for scanned PDFs (Gemini, up to 250 pages) incl. descriptions of figures/tables on slides
- **Provider fallback** — Gemini → Groq / Cerebras / OpenRouter / Mistral / Anthropic when one hits quota
- **Daily quota** — Free 5, Premium 50, Pro unlimited questions per day

### Study tools
- **Exam calendar** (`/takvim`) — countdowns, urgency colours, email + in-app reminders 3 days and 1 day before
- **Grade calculator** (`/hesaplayici`) — required final score, relative grading (z/T-score), GPA (YANO/AGNO)

### Account, monetization & platform
- **Auth** — Google OAuth + email/password with confirmation, password reset, password rules; account settings with KVKK-compliant account deletion
- **Three tiers** — Free / Premium / Pro (Stripe scaffolded, env-gated — not live yet)
- **Ad slots** for free users (Google AdSense-ready)
- **3 themes** — Light / Dark / custom “Notvia” theme
- **PWA** — installable on mobile
- **Mandatory profiles** (name, university, department, class) to keep content organized

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/), `next-themes`, Inter + Sora fonts |
| Backend / DB | [Supabase](https://supabase.com/) — Postgres, Auth (Google OAuth + email), Storage, Row-Level Security |
| AI | [Google Gemini](https://ai.google.dev/) (chat, embeddings, OCR) + Groq / Cerebras / OpenRouter / Mistral / Anthropic fallback, pgvector RAG |
| Email | [Brevo](https://www.brevo.com/) transactional API |
| Payments | [Stripe](https://stripe.com/) (scaffolded, env-gated) |
| Hosting | [Vercel](https://vercel.com/) |

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project
- (Optional) Google Gemini API key (plus optional fallback LLM keys), Brevo account, Stripe & AdSense for full features

### 1. Clone & install
```bash
git clone https://github.com/BerkeBakir/notvia.git
cd notvia
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Google Gemini required for embeddings/OCR; others are optional chat fallbacks)
GEMINI_API_KEY=
GROQ_API_KEY=
CEREBRAS_API_KEY=
OPENROUTER_API_KEY=
MISTRAL_API_KEY=

# Email notifications (Brevo)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Notvia

# Email link base (optional)
NEXT_PUBLIC_SITE_URL=

# Payments (Stripe) — optional, for going live
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PREMIUM=
STRIPE_PRICE_PRO=

# Ads (Google AdSense) — optional
NEXT_PUBLIC_ADSENSE_CLIENT=

# Vercel cron jobs (weekly digest, exam reminders)
CRON_SECRET=
```

### 3. Database
Run the SQL migrations in `supabase/migrations/` **in order** (`0001` → `0038`) via the Supabase **SQL Editor**. They create the schema, RLS policies, triggers, and storage bucket. Optionally seed Turkish universities with `supabase/seed/universities_tr.sql`.

### 4. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

> ⚠️ In Supabase → Authentication → URL Configuration, add your app URL (e.g. `http://localhost:3000/**` and your production domain) to the redirect allow-list so login works.

---

## 📁 Project structure

```
src/
  app/
    (auth)/login            # Google + email auth
    (main)/                 # Header + Footer layout
      notes/                # browse, upload, note detail
      courses/              # course pages, add course
      departments/[id]      # department + top notes
      tags/[id]             # notes by tag
      search/               # search & filter
      profile/              # dashboard, points, badges, edit
      premium/              # pricing tiers
      leaderboard/          # top contributors
      notifications/        # in-app notifications
      asistan/              # AI study companion
      arkadaslar/           # friends & feed
      istekler/             # note requests
      takvim/               # exam calendar
      hesaplayici/          # grade calculator
      gorevler/             # weekly quests
      kaydedilenler/        # saved notes
      ayarlar/              # account settings
      admin/                # moderation panel
    auth/                   # email confirm, new password
    api/                    # auth, AI, cron, checkout, webhooks, feedback, notify
  components/               # UI: notes, layout, auth, ads, premium, pwa, ...
  lib/
    supabase/               # browser/server/admin clients, auth helpers
    ai/                     # RAG, embeddings, OCR, LLM providers, quota
    actions/                # server actions (votes, referral, streak, account)
    stripe.ts, rating.ts, contribution.ts
supabase/
  migrations/               # SQL schema, RLS, triggers, RPCs (0001–0038)
  seed/                     # Turkish universities, sample data
```

---

## ☁️ Deployment

Deployed on **Vercel**. To deploy your own:
1. Push to GitHub and import the repo on [vercel.com](https://vercel.com/) (auto-detects Next.js).
2. Add all environment variables in **Project → Settings → Environment Variables**.
3. In Supabase, add your Vercel domain to the Auth redirect allow-list.

---

## 🗺️ Roadmap

- Real payment provider for production (Turkey: İyzico / PayTR or a Merchant-of-Record like Lemon Squeezy)

---

## 📄 License

© 2026 Notvia. All rights reserved. This source is published for portfolio/demonstration purposes; not licensed for commercial reuse without permission.
