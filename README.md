# MandiBook Lab

Digital mandi bahi-khata pilot app for **adatiyas / aadat vyaparis** — by Ramatech Innovation Pvt Ltd.

Manage Kisan ledger, Vyapari ledger, mandi transactions, commission, deductions, payments, baki/jama, WhatsApp statements, and daily closing.

## Stack

- Next.js 15 (App Router)
- TypeScript · Tailwind CSS · shadcn-style UI
- Supabase (Phone OTP Auth + PostgreSQL)
- Prisma ORM
- Vercel deployment

## Local setup

```bash
cd mandibook-lab
npm install
cp .env.example .env.local
# Fill in Supabase keys and database URLs
npm run db:migrate:deploy
npm run db:seed
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
| `DIRECT_URL` | Direct connection (port 5432) for migrations |

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Phone**: enable Phone auth
3. Configure SMS provider (Twilio recommended for India):
   - Supabase Dashboard → Project Settings → Auth → SMS
   - Add Twilio Account SID, Auth Token, Message Service SID
4. Copy API keys and database connection strings to `.env.local`
5. **Auth → URL Configuration**: add redirect URL:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://your-app.vercel.app/auth/callback` (prod)

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

### Seed data

- 1 firm: Sharma Adat Agency (Azadpur Mandi)
- 2 kisans, 2 vyaparis
- 3 commodities (Aloo, Pyaz, Tamatar)
- 3 sample transactions with ledger entries
- 2 sample payments

> Seed uses placeholder `userId`. After your first OTP login, complete onboarding to create your real firm, or update seed user ID to match your Supabase auth user.

## Vercel deployment

1. Push `mandibook-lab` to GitHub (separate repo recommended)
2. Import in Vercel → Framework: Next.js
3. Add all env vars from `.env.example`
4. Build command: `prisma generate && next build` (default via `package.json`)
5. Deploy and add production URL to Supabase Auth redirect allowlist

## App routes

| Route | Purpose |
|-------|---------|
| `/login` | Phone OTP login |
| `/onboarding` | Firm setup (owner) or Munim join |
| `/dashboard` | Today's stats + quick actions |
| `/kisan` | Kisan list + ledger |
| `/vyapari` | Vyapari list + ledger |
| `/maal` | Commodity management |
| `/transactions/new` | Record sale (primary UX) |
| `/payments` | Record jama/payment |
| `/reports/daily-closing` | Aaj ka Closing |
| `/settings` | Firm settings, Munim invite |

## Ledger rules

- Balances are **never stored directly** — computed from ledger entries
- **Sale**: Kisan CREDIT (farmer payable), Vyapari DEBIT (trader receivable)
- **Payment to Kisan**: DEBIT
- **Payment from Vyapari**: CREDIT

## Pilot checklist

1. Configure Supabase Phone OTP with SMS
2. Deploy to Vercel
3. Owner completes onboarding on phone
4. Add 2–3 kisans, vyaparis, maal
5. Record test sale → verify ledger + WhatsApp share
6. Invite Munim via Settings
7. Hand to 2–3 real adatiyas for 15–30 day pilot

## License

Private — Ramatech Innovation Pvt Ltd
