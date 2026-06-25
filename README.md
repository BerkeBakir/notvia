# 🎓 Notvia

**A note & past-exam sharing platform for university students.**

Browse by university → department → course, upload and download lecture notes and past exam papers as PDFs, follow courses for email alerts, and study smarter with AI tools — all in one community-driven platform.

🌐 **Live demo:** [notvia.vercel.app](https://notvia.vercel.app)

---

## ✨ Features

### Content & discovery
- **Community-driven hierarchy** — university → department → course, all added & maintained by students
- **PDF upload & download** — lecture notes and past exam papers (PDF-only, 20 MB limit), with real download counter
- **Search & filter** — search note titles, filter by university/department, sort by most liked / newest / most downloaded
- **Tags** — tag notes and browse by tag
- **Trending** — popular notes surfaced on the home page and per department
- **Related notes** — suggestions from the same course

### Social & community
- **Likes / dislikes** with a derived **5-star rating**
- **Comments** on every note
- **Favorites** — save notes to your profile
- **In-app notifications** — bell with unread badge (new comment / like / note in a followed course)
- **Email notifications** — get notified when a note is added to a course you follow
- **Course verification** — community voting (3 confirmations marks a course “verified”)
- **Reporting** — flag inappropriate or copyrighted content
- **Contribution points, levels & badges** + a global **leaderboard**
- **Referrals** — invite friends and earn points

### AI study tools (Pro)
- **AI summary** — instant summary of any uploaded note
- **AI question generator** — practice exam questions from a note
- **AI flashcards** — auto-generated study cards
- **Ask the note** — ask questions answered from the note’s content

### Monetization & platform
- **Three tiers** — Free / Premium / Pro (payment flow scaffolded; demo/mock UI)
- **Ad slots** for free users (Google AdSense-ready) + a download interstitial
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
| AI | [Google Gemini](https://ai.google.dev/) (Flash) for summaries, questions, flashcards |
| Email | [Brevo](https://www.brevo.com/) transactional API |
| Payments | [Stripe](https://stripe.com/) (scaffolded, env-gated) |
| Hosting | [Vercel](https://vercel.com/) |

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project
- (Optional) Google Gemini API key, Brevo account, Stripe & AdSense for full features

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

# AI summaries / tools (Google Gemini)
GEMINI_API_KEY=

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
```

### 3. Database
Run the SQL migrations in `supabase/migrations/` **in order** (`0001` → `0014`) via the Supabase **SQL Editor**. They create the schema, RLS policies, triggers, and storage bucket. Optionally seed Turkish universities with `supabase/seed/universities_tr.sql`.

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
    api/                    # auth callback, AI, checkout, webhooks, notify
  components/               # UI: notes, layout, auth, ads, premium, pwa, ...
  lib/
    supabase/               # browser/server/admin clients, auth helpers
    ai/                     # Gemini integration
    stripe.ts, rating.ts, contribution.ts
supabase/
  migrations/               # SQL schema, RLS, triggers (0001–0014)
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
- Moderation dashboard
- Real PNG PWA icons (192 / 512)
- Legal pages (KVKK / privacy / terms)
- Analytics & SEO

---

## 📄 License

© 2026 Notvia. All rights reserved. This source is published for portfolio/demonstration purposes; not licensed for commercial reuse without permission.
