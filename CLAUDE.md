# FitTrack — Project Context
 
Personal fitness tracking PWA. Solo project, alpha-testing with one friend.
 
## Stack
- Vue 3 + TypeScript + Pinia + Vite
- Dexie (IndexedDB) — local storage, source of truth for instant reads/writes
- Supabase (Postgres + Auth) — optional cloud sync layer, entirely additive
- Tailwind CSS v4 (CSS-first config via `@config` directive in `src/style.css`, not just `tailwind.config.js`)
- Chart.js for progress graphs
- `vite-plugin-pwa` for offline/installable support
- Vitest for testing — **254 tests, all passing, keep it that way**
## Design system
Dark theme, Strava/Whoop-inspired. Color tokens in `tailwind.config.js`:
- `accent` = orange (#ff5a2b) — primary actions
- `lime` = (#c6ff5e) — success/positive states, PR badges
- `canvas` = near-black backgrounds (⚠️ deliberately NOT named `base` — see Known Gotchas)
- `surface` / `ink` — card backgrounds / text
Reusable component classes (`.btn-primary`, `.card-pad`, `.field-input`, etc.) live in
`src/style.css` under `@layer components`.
## Architecture notes
- **Navigation**: `TopBar.vue` (desktop pill nav + account controls) + `BottomNav.vue`
  (mobile fixed tab bar). Both read/write `stores/ui.ts`'s `activeTab`.
- **Cloud sync** (`src/services/cloudSync.ts`): fire-and-forget push to Supabase on every
  local mutation, queued in localStorage on failure, retried on `online` event and app
  boot. `pullAndHydrate()` runs on sign-in to catch a second device up. This is
  last-write-wins at the row level — fine for one user on a couple of devices, NOT
  designed for concurrent multi-writer conflict resolution.
- **Auth is fully optional**: everything in `stores/auth.ts` and `cloudSync.ts` checks
  `isCloudEnabled()` first and no-ops if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
  aren't set. The app must always work local-only with zero config — don't break that.
- **Weight unit conversion** (`src/utils/units.ts`): canonical storage is ALWAYS kg.
  `settingsStore.weightUnit` (kg/lb) only affects display/input conversion — never
  change what gets written to IndexedDB/Supabase.
- **Personal records** (`src/utils/personalRecords.ts`): computed from full performance
  history via `sessionsStore.performanceByExercise(id)`, not stored separately.
- **Rest timer** (`stores/restTimer.ts`): lives in a Pinia store, not a component, so it
  keeps counting across tab switches. `RestTimer.vue` just renders whatever state is there.
## Known gotchas (already hit these once, don't re-introduce)
1. **Never name a Tailwind color token `base`** — it collides with Tailwind's built-in
   `text-base` (font-size) utility and silently breaks `@apply text-base`. That's why the
   background color token is called `canvas`, not `base`.
2. **Global `h1`/`h2`/`h3` color rules must live in `@layer base`**, not as bare
   unlayered CSS — unlayered rules always beat Tailwind utility classes regardless of
   specificity, which broke heading colors once already.
3. **IndexedDB + Vue reactivity**: never pass a reactive Proxy object/array straight into
   `db.table.put()` — causes a `DataCloneError`. `storageService` already guards this with
   a `toPlain()` JSON round-trip; keep using it for any new write paths.
4. Floating widgets (`InstallPrompt`, `RestTimer`, `PRToast`) all use `position: fixed`
   near screen edges — check for overlap when adding another one. Modals use `z-[60]`,
   everything else `z-50`, on purpose (modals must always win).
## Testing
Run `npm run test` before considering any change done — 254 tests currently pass.
`npm run build` also runs `vue-tsc` type-checking; treat TS errors as build failures.
 
## What's NOT done yet (candidates for next session)
- Multiple saved routines/programs (currently just one weekly routine)
- Exercise history detail view (tap an exercise, see every past log)
- Body weight/measurements tracking (separate from workout data)
- Apple Health / Google Fit integration
- No app-level rate limiting beyond Supabase's defaults (fine for personal/alpha use)
- No CAPTCHA on signup (fine at current scale; revisit if the signup URL goes public)
## Environment setup
`.env` is gitignored on purpose (never commit Supabase keys) — copy `.env.example` to
`.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` locally. The app runs
fine with `.env` empty/absent — just local-only, no auth gate.
 
Full cloud sync setup walkthrough: see `CLOUD_SYNC_SETUP.md`.
Supabase schema (tables + RLS policies): see `supabase/schema.sql`.
