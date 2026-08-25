# FitTrack

A fitness tracking Progressive Web App built with Vue 3 and TypeScript. Track your exercises, build a weekly workout routine, log daily performance, and visualize your progress over time. Data is stored locally in your browser via IndexedDB and works fully offline — cloud sync and multi-device auth are entirely optional add-ons.

---

## Features

- **Exercise Management** — Create, edit, and delete exercises with target sets, reps, and muscle groups
- **Routine Builder** — Assign exercises to specific days of the week to build a recurring weekly schedule
- **Daily Checklist** — View today's assigned exercises, mark them complete, and log actual performance (sets, reps, weight, difficulty)
- **Weekly Summary** — See how many workouts were assigned vs. completed for any given week, with a per-day breakdown
- **Progress Graphs** — Visualize reps, weight, and completion rate trends over time per exercise using interactive charts
- **Personal Records** — Automatically detects and celebrates new weight/rep PRs as you log performance, computed from your full exercise history
- **Rest Timer** — A persistent rest timer that keeps counting even if you switch tabs or views mid-set
- **Weight Units** — Toggle displayed weights between kg and lb; canonical storage is always kg, so switching units never changes your logged data
- **Installable PWA** — Install to your home screen and use the app fully offline; the app shell is precached so there's no loading screen on repeat visits
- **Optional Cloud Sync** — Sign in to sync your data across devices via Supabase. Fully optional — the app works with zero config, local-only, with no account

---

## Tech Stack

| Category         | Technology                                  |
|------------------|----------------------------------------------|
| Framework        | Vue 3 (Composition API)                       |
| Language         | TypeScript (strict mode)                      |
| State Management | Pinia                                         |
| Local Storage    | Dexie.js (IndexedDB wrapper) — source of truth |
| Cloud Sync & Auth| Supabase (Postgres + Auth) — optional          |
| Charts           | Chart.js                                      |
| Styling          | Tailwind CSS v4 (CSS-first config)            |
| PWA              | vite-plugin-pwa (offline caching, installability) |
| Build Tool       | Vite                                          |
| Testing          | Vitest + @vue/test-utils (unit, e2e, and property-based tests) |

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later (bundled with Node.js)

---

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd workout-app

# Install dependencies
npm install
```

---

## Environment Setup (Optional Cloud Sync)

The app runs fully local-only with zero configuration — no `.env` file needed. To enable optional cross-device cloud sync and sign-in:

```bash
cp .env.example .env
```

Then fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project (Settings → API). Leave both unset to run fully offline/local — the app behaves identically either way, just without an auth gate or cross-device sync.

`.env` is gitignored — never commit your Supabase keys.

For the full walkthrough (creating a Supabase project, applying the schema, enabling RLS), see [CLOUD_SYNC_SETUP.md](./CLOUD_SYNC_SETUP.md). The schema and Row Level Security policies live in [supabase/schema.sql](./supabase/schema.sql).

---

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default. Changes to source files hot-reload automatically.

---

## Building for Production

```bash
npm run build
```

This runs `vue-tsc` type-checking followed by the Vite build; the output is written to the `dist/` directory. You can preview the production build locally with:

```bash
npm run preview
```

---

## Running Tests

Run all tests once:

```bash
npm run test
```

Run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```

Run tests with coverage report:

```bash
npm run test:coverage
```

Open the interactive test UI:

```bash
npm run test:ui
```

Tests are co-located with the components/logic they cover, split into unit tests (`*.test.ts`), end-to-end flow tests (`*.e2e.test.ts`), and property-based tests (`*.property.test.ts`).

---

## Project Structure

```
workout-app/
├── src/
│   ├── components/           # Vue components (UI + co-located tests)
│   │   ├── ExerciseManager.vue / ExerciseForm.vue / ExerciseList.vue / ExerciseSelector.vue
│   │   ├── RoutineBuilder.vue
│   │   ├── DailyChecklist.vue / ChecklistItems.vue / DaySelector.vue
│   │   ├── WeeklySummary.vue / WeeklyGrid.vue / DayBreakdown.vue / WeekNavigator.vue / SummaryStats.vue
│   │   ├── ProgressGraphs.vue / WeightChart.vue / RepsChart.vue / CompletionRateChart.vue
│   │   ├── GraphExerciseSelector.vue / TimeRangeSelector.vue
│   │   ├── AuthGate.vue / PasswordRecoveryGate.vue / SetNewPasswordForm.vue / ChangePasswordModal.vue
│   │   ├── TopBar.vue / BottomNav.vue / Layout.vue
│   │   ├── RestTimer.vue / PRToast.vue / InstallPrompt.vue / VirtualList.vue
│   │   └── ...
│   ├── models/                # TypeScript data models and interfaces
│   │   ├── Exercise.ts
│   │   ├── Routine.ts
│   │   ├── WorkoutSession.ts
│   │   └── types.ts
│   ├── stores/                 # Pinia state stores
│   │   ├── exercises.ts / routine.ts / workoutSessions.ts
│   │   ├── ui.ts                # active tab, selected date/exercise, time range
│   │   ├── auth.ts              # optional Supabase auth session state
│   │   ├── settings.ts          # weight unit + rest timer duration (localStorage)
│   │   ├── restTimer.ts         # persistent rest timer state
│   │   └── types.ts
│   ├── services/               # Storage, sync, and Supabase layer
│   │   ├── database.ts          # Dexie (IndexedDB) schema
│   │   ├── storage.ts           # CRUD with retry/backoff, quota handling
│   │   ├── sync.ts              # Pinia store <-> IndexedDB watchers
│   │   ├── cloudSync.ts         # optional fire-and-forget push/pull to Supabase
│   │   └── supabaseClient.ts    # Supabase client, no-ops when unconfigured
│   ├── composables/            # Reusable Vue composables
│   │   ├── useAppInitialization.ts
│   │   └── useComputedCache.ts
│   ├── utils/                  # Pure helper functions
│   │   ├── units.ts             # kg/lb conversion (canonical storage is always kg)
│   │   ├── personalRecords.ts   # PR calculation from performance history
│   │   ├── calculations.ts
│   │   └── validators.ts
│   ├── tests/                  # Shared test setup and factories
│   ├── App.vue                  # Root component, auth gate, and layout
│   └── main.ts                  # App entry point
├── supabase/
│   └── schema.sql               # Postgres schema + RLS policies for cloud sync
├── public/
├── index.html
├── vite.config.ts                # includes vite-plugin-pwa manifest/workbox config
├── tsconfig.json
└── package.json
```

---

## How to Use the App

### 1. Add Exercises
Navigate to **Exercises** and create the exercises you perform. Each exercise has a name, target sets, target reps, and optional muscle groups. These form the library you draw from when building routines.

### 2. Build a Routine
Navigate to **Routine** and assign exercises to days of the week. You can add multiple exercises per day. The routine repeats weekly — any day with no assignments is treated as a rest day.

### 3. Log Daily Workouts
Navigate to **Today** (Daily Checklist) to see exercises scheduled for the current day. Check off each exercise as you complete it. When you mark one complete, you'll be prompted to log actual sets, reps, weight, and a difficulty rating. Setting a new heaviest weight or highest rep count for an exercise triggers a personal record toast. Use the rest timer between sets — it keeps running even if you switch to another tab in the app.

### 4. Review Your Week
Navigate to **Summary** to see a weekly overview: total workouts assigned, total completed, completion percentage, and a day-by-day breakdown. Use the week navigator to look back at previous weeks.

### 5. Track Progress
Navigate to **Progress** to view charts for any exercise. Select an exercise and a time range to see how your reps, weight, and weekly completion rate have changed over time. Toggle between kg and lb display in settings — this only affects how numbers are shown, not what's stored.

### 6. Install as an App (Optional)
The app is an installable PWA. Use your browser's "Install" or "Add to Home Screen" prompt (or the in-app install banner) to add FitTrack to your device and launch it like a native app, fully offline.

### 7. Enable Cloud Sync (Optional)
If `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are configured, you can sign in to sync your data across devices. Skipping sign-in keeps the app entirely local, exactly as it works with no configuration at all.

---

## Data Storage

All data is stored locally in your browser using **IndexedDB** (via Dexie.js), which is always the source of truth for instant reads and writes — no account or internet connection is required. Data persists across sessions but is tied to the browser profile — clearing browser data will erase it, unless cloud sync is enabled.

When cloud sync is configured and you sign in, every local change is also pushed to Supabase in the background (queued and retried automatically if you're offline), and signing in on a second device pulls the latest data down to catch it up. This is last-write-wins at the row level — designed for one person syncing between their own devices, not concurrent multi-user editing.
