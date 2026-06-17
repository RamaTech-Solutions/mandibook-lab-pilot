# Supabase Email Template (OTP + Login Link)

MandiBook Lab uses **email OTP** login. By default Supabase sends only a **magic link** (no code). Update the template once in your Supabase dashboard (requires custom SMTP).

## OTP length

Supabase production often sends **8-digit** codes (configurable 6–10). The login page accepts **6–10 digits**.

To change length: **Authentication → Providers → Email → OTP length** (e.g. set to `6` or `8`).

## Steps

1. Set up **custom SMTP** (Resend, etc.) — required to edit templates
2. Open **Supabase Dashboard → Authentication → Email Templates**
3. Select **Magic Link** (used for `signInWithOtp` email)
4. Replace the body with the HTML below
5. Save

## Recommended template

**Subject:** `MandiBook Lab login code`

**Body:**

```html
<h2>MandiBook Lab login</h2>
<p>Apna login code enter karein (email mein jo number dikhe, poora daalein):</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>Ya is link par click karein (ek baar hi kaam karega):</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Login karein</a></p>
<p>Code jaldi expire ho jata hai — turant use karein.</p>
```

## URL configuration (required)

**Authentication → URL Configuration:**

| Setting | Value |
|---------|--------|
| Site URL | `https://mandibook-lab-pilot.vercel.app` |
| Redirect URLs | `https://mandibook-lab-pilot.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

## After updating

1. Request a new OTP from `/login` (old emails won't have the code)
2. Enter the **full code** from email (all digits, e.g. 8-digit `84003757`), **or** click **Login karein**
3. You should land on `/dashboard` or `/onboarding`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Email shows only "Sign in" link, no code | Template not saved — paste HTML above; SMTP required |
| "Token expired" on login | Enter **full** code (not truncated); request new OTP |
| Link opens login page again | Check Redirect URLs include `/auth/callback` |
| OTP invalid | Request fresh code; codes expire quickly |
| No email | Check spam; Supabase free tier is rate-limited (~2–4/hr) |
