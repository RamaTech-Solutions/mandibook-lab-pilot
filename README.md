# MandiBook Lab

Digital mandi bahi-khata pilot app for **adatiyas / aadat vyaparis** — by Ramatech Innovation Pvt Ltd.

Manage Kisan ledger, Vyapari ledger, mandi transactions, commission, deductions, payments, baki/jama, WhatsApp statements, and daily closing.

## Stack

- Next.js 15 (App Router)
- TypeScript · Tailwind CSS · shadcn-style UI
- Supabase (Email OTP Auth for pilot + PostgreSQL)
- Prisma ORM
- Vercel deployment

## Local setup

```bash
cd mandibook-lab
npm install
cp .env.example .env.local
# Fill in Supabase keys and database URLs
npm run db:migrate:deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) from dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon key (optional if publishable key is set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (seed/admin only, never expose to client) |
| `DATABASE_URL` | Pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Session pooler or direct (port 5432) for migrations |
| `NEXT_PUBLIC_AUTH_PHONE_ENABLED` | Set `true` when Twilio phone OTP is ready (default: `false`) |

## Supabase setup (Email OTP pilot)

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Email** → Enable
3. For faster pilot testing, consider disabling **Confirm email** (OTP only)
4. **Auth → URL Configuration**:
   - Site URL: your Vercel URL or `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`
5. Copy API keys and database connection strings to `.env.local`
6. **Email template (required for OTP):** See [docs/SUPABASE-EMAIL-TEMPLATE.md](docs/SUPABASE-EMAIL-TEMPLATE.md) — default Supabase email sends a magic link only; add `{{ .Token }}` for 6-digit OTP

### Email deliverability

- Supabase built-in email works for pilot but is rate-limited on free tier (~2–4/hr)
- For reliable OTP delivery: **Project Settings → Auth → SMTP** (Resend, SendGrid, etc.)
- Ask pilot users to check spam folder

### Phone OTP (later, optional)

When Twilio is ready:

1. **Authentication → Providers → Phone** → Enable
2. Configure SMS in **Project Settings → Auth → SMS**
3. Set `NEXT_PUBLIC_AUTH_PHONE_ENABLED=true` in Vercel and `.env.local`

## Database

```bash
npm install                  # Required first — installs Prisma 6 from package.json
npm run db:migrate:deploy    # Apply migrations to Supabase (production)
npm run db:migrate           # Create new migrations (local dev only)
npm run db:seed              # Demo data (optional — skip for fresh adatiya onboarding)
npm run db:studio            # Prisma Studio
```

**Important:** Do not run bare `npx prisma` — it may install Prisma 7 and fail. Use `npm run db:migrate:deploy` after `npm install`.

If migrate fails, see [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md) (connection strings + SQL Editor fallback).

## Vercel deployment

1. Push `mandibook-lab` to GitHub
2. Import in Vercel → Framework: Next.js
3. Add all env vars from `.env.example` (including `NEXT_PUBLIC_AUTH_PHONE_ENABLED=false`)
4. Build command: `prisma generate && next build` (default via `package.json`)
5. Deploy and add production URL to Supabase Auth redirect allowlist

## App routes

| Route | Purpose |
|-------|---------|
| `/login` | Email OTP login (phone when Twilio enabled) |
| `/onboarding` | Firm setup (owner) or Munim join by email |
| `/dashboard` | Today's stats + quick actions |
| `/kisan` | Kisan list + ledger |
| `/vyapari` | Vyapari list + ledger |
| `/maal` | Commodity management |
| `/transactions/new` | Record sale (primary UX) |
| `/payments` | Record jama/payment |
| `/reports/daily-closing` | Aaj ka Closing |
| `/settings` | Firm settings, Munim invite by email |

## Ledger rules

- Balances are **never stored directly** — computed from ledger entries
- **Sale**: Kisan CREDIT (farmer payable), Vyapari DEBIT (trader receivable)
- **Payment to Kisan**: DEBIT
- **Payment from Vyapari**: CREDIT

## Pilot checklist (Email OTP)

1. Enable Supabase Email provider + set Site URL to Vercel domain
2. Deploy to Vercel with env vars
3. Owner: `/login` → email OTP → onboarding → dashboard
4. Add kisans, vyaparis, maal, record a test sale
5. Settings → invite Munim by **email**
6. Munim: login with invited email → join firm → use app
7. (Later) Enable Twilio + `NEXT_PUBLIC_AUTH_PHONE_ENABLED=true` for phone login

## License

Private — Ramatech Innovation Pvt Ltd
