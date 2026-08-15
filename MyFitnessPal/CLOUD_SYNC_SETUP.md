# Setting up cloud sync (multi-device)

By default FitTrack stores everything locally on-device in IndexedDB — it works great, but
data doesn't leave that one browser/device. Follow these steps to add free cloud sync via
[Supabase](https://supabase.com) so your data follows you between your phone and laptop.

This takes about 10 minutes and costs nothing (Supabase's free tier — 500MB database,
50k monthly active users — is far more than one person's workout log will ever need).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (GitHub login is fastest).
2. Click **New Project**. Pick any name/region, set a database password (save it somewhere —
   you won't need it day-to-day, but keep it safe).
3. Wait ~2 minutes for the project to provision.

## 2. Create the database tables

1. In your Supabase project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` in this repo, paste its full contents into the editor, and
   click **Run**.
3. This creates three tables (`exercises`, `routines`, `workout_sessions`) with row-level
   security so your data is only ever visible to your own account — nobody else's data can
   be read or written, even through the API.

## 3. Get your API credentials

1. In Supabase, go to **Settings → API**.
2. Copy the **Project URL** and the **anon public** key (not the `service_role` key — that
   one is for servers, never put it in frontend code).

## 4. Configure the app

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the two values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Rebuild and redeploy:
   ```bash
   npm run build
   ```
   Deploy the `dist/` folder to your host (Vercel, Netlify, GitHub Pages, etc.) as before —
   **make sure the same two environment variables are set in your hosting provider's
   dashboard too**, since `.env` itself isn't deployed.

## 5. Sign in on each device

Open the app — you'll now see a sign-in screen. Create an account (email + password) on
your first device, then sign in with the same account on your second device. Both will
sync automatically from then on.

By default, Supabase requires email confirmation before first sign-in — check your inbox
after signing up. You can turn this off for personal use under **Authentication → Providers
→ Email → Confirm email** in the Supabase dashboard if you'd rather skip that step.

## How it behaves offline

- The app always reads/writes to IndexedDB first, so it's instant and fully usable with no
  connection — same as before.
- Every change is also pushed to Supabase in the background. If you're offline, it's queued
  and retried automatically once you're back online.
- On app launch (while signed in), it pulls the latest from Supabase so a second device
  catches up.

## Skipping cloud sync

If you leave `.env` empty (or never create it), the app works exactly as it did before —
no sign-in screen, everything local-only. You can also tap **"Skip for now"** on the
sign-in screen at any time to use that device locally without an account.
