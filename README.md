# HACK-CTF — Cyber-Immersive CTF Platform

A full-stack, futuristic Capture The Flag platform built with **Next.js 15**, **Tailwind CSS v4**, and **Supabase**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 Challenge Dashboard | Filterable grid of challenge cards. Solved cards turn neon-green. |
| 🖥️ Terminal Flag Input | Sci-Fi styled flag submission with server-side bcrypt verification. |
| 📊 Live Scoreboard | Real-time rankings powered by Supabase Realtime. |
| 👤 Player Profile | Points, rank, completion bar, and earned badges. |
| 🔐 Auth | Email/password auth via Supabase Auth. |
| 🌌 Futuristic UI | Neon glow, scanlines, glitch effects, hex-grid background. |

---

## 🗂️ Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout (Navbar, scanlines, hex-grid)
│   ├── page.tsx                # Landing page
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx      # Challenge grid
│   ├── scoreboard/page.tsx     # Live scoreboard
│   ├── profile/page.tsx        # User profile & badges
│   └── api/
│       └── validate-flag/      # Secure flag validation endpoint
├── components/
│   ├── ui/                     # CyberButton, CyberCard, CyberInput, GlitchText, TerminalText
│   ├── layout/                 # Navbar
│   ├── dashboard/              # ChallengeCard, ChallengeGrid, FlagSubmit
│   ├── scoreboard/             # ScoreboardTable
│   └── profile/                # UserProfile
├── lib/supabase/               # client.ts, server.ts, types.ts
├── middleware.ts               # Auth-gated route protection
├── supabase/
│   └── schema.sql              # Full DB schema + seed data
└── .env.example                # Environment variable template
```

---

## 🚀 Getting Started

### 1 — Clone & Install

```bash
git clone https://github.com/H1v3-lab/HACK-CTF.git
cd HACK-CTF
npm install
```

### 2 — Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Copy your **Project URL** and **anon key** from *Settings → API*.

### 3 — Environment Variables

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4 — Run Locally

```bash
npm run dev
# → http://localhost:3000
```

### 5 — Deploy

**Vercel** (recommended):
```bash
npx vercel --prod
# Set env vars in Vercel dashboard
```

**GitHub Pages** (static export):
```bash
# Add to next.config.ts: output: 'export'
npm run build
# Deploy ./out directory
```

---

## 🗄️ Database Schema

See [`supabase/schema.sql`](supabase/schema.sql) for the full schema.

### Tables

| Table | Description |
|---|---|
| `profiles` | Extends `auth.users` — username, score, rank |
| `challenges` | CTF challenges with bcrypt-hashed flags |
| `categories` | Challenge categories (Web, Crypto, …) |
| `submissions` | All flag attempts (correct & incorrect) |
| `badges` | Achievement definitions |
| `user_badges` | Junction: which user earned which badge |

### Views

| View | Description |
|---|---|
| `scoreboard` | Ranked players with solve count and last solve time |
| `user_solves` | Solved challenge IDs per user |

### RPC Functions

| Function | Description |
|---|---|
| `verify_flag(submitted, stored_hash)` | bcrypt comparison via pgcrypto |
| `increment_solves(challenge_id)` | Atomic solve counter increment |
| `increment_score(user_id, points)` | Atomic score increment |

---

## 🔒 Flag Hashing

Flags are stored as bcrypt hashes (via pgcrypto `crypt()`). To hash a flag for insertion:

```sql
-- In Supabase SQL Editor
SELECT crypt('HACK{your_flag_here}', gen_salt('bf'));
```

Insert the resulting hash into `challenges.flag_hash`.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#000000` | Page background |
| `--cyber-cyan` | `#00f3ff` | Primary accent, borders |
| `--cyber-green` | `#00ff41` | Solved state, success |
| `--cyber-pink` | `#ff00ff` | Glitch overlay, Insane difficulty |

CSS utility classes: `.neon-cyan`, `.neon-green`, `.neon-box-cyan`, `.cyber-card`, `.cyber-btn`, `.glitch`, `.scanlines`, `.hex-grid-bg`, `.terminal-input`

---

## 🔊 Audio Placeholders

Sound effect hooks are available in `public/sounds/`. Drop `.mp3` / `.ogg` files there:

| File | Trigger |
|---|---|
| `click.mp3` | Button press |
| `correct.mp3` | Correct flag |
| `wrong.mp3` | Incorrect flag |
| `unlock.mp3` | Badge earned |

---

## 📄 License

MIT © H1v3-lab
