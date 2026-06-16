# Step 2 — Database setup (troubleshooting)

## Error: Prisma 7 / `url` no longer supported in schema

**Cause:** Running `npx prisma migrate deploy` without `npm install` first downloads **Prisma 7**, which breaks this project.

**Fix — always use project Prisma 6:**

```bash
cd /Users/apple/Documents/Cursor-project/mandibook-lab
npm install
npm run db:migrate:deploy
```

Do **not** use bare `npx prisma` unless you pin version: `npx prisma@6 migrate deploy`

---

## Error: P1001 Can't reach database server

**Causes:**
1. Supabase project **paused** (free tier) → Dashboard → **Restore project**
2. Wrong **region** in pooler URL (`aws-0-ap-south-1` may not match your project)
3. Missing **SSL** on connection string

**Fix — copy exact URIs from Supabase:**

1. Supabase Dashboard → **Project Settings → Database**
2. **Connection string → URI**
3. **Transaction pooler (6543)** → paste as `DATABASE_URL` (must include `?pgbouncer=true`)
4. **Session pooler (5432)** or **Direct** → paste as `DIRECT_URL`

Update both `.env` and `.env.local`, then:

```bash
npm run db:migrate:deploy
```

### Direct connection (from Supabase → Database → Connection string)

Host: `db.gqcugvrlvyjbfhbxixau.supabase.co` · Port: `5432` · User: `postgres` · DB: `postgres`

If your password contains `@` or `#`, URL-encode it in the URI:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |

Example (password `csbFp3@1#123`):

```env
DIRECT_URL=postgresql://postgres:csbFp3%401%23123@db.gqcugvrlvyjbfhbxixau.supabase.co:5432/postgres?sslmode=require
```

For **pilot**, you can use the same URI for both (later switch `DATABASE_URL` to Transaction pooler port 6543 on Vercel):

```env
DATABASE_URL=postgresql://postgres:csbFp3%401%23123@db.gqcugvrlvyjbfhbxixau.supabase.co:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:csbFp3%401%23123@db.gqcugvrlvyjbfhbxixau.supabase.co:5432/postgres?sslmode=require
```

Then:

```bash
npm install
npm run db:migrate:deploy
```

**If P1001 "Can't reach database":**
- Supabase project **paused** → Dashboard → Restore
- Wrong password → reset in Database Settings
- Corporate firewall blocking port 5432 → try mobile hotspot or SQL Editor fallback below

---

## Fallback — run migration SQL manually

If `migrate deploy` still fails, use Supabase **SQL Editor**:

1. Open `prisma/migrations/20250616000000_init/migration.sql`
2. Copy entire file
3. Supabase → **SQL Editor → New query** → Paste → **Run**

Then mark migration as applied (in SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMPTZ,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);
```

Or after manual SQL, run:

```bash
npx prisma@6 migrate resolve --applied 20250616000000_init
```

---

## Verify tables exist

Supabase → **Table Editor** → should list:

`firms`, `profiles`, `parties`, `commodities`, `transactions`, `ledger_entries`, `payments`, `audit_logs`, `munim_invites`

Then continue to Vercel deploy.
