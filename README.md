# Fitness Tracker

A client-side fitness tracking web app built with Vue 3 and TypeScript. Track your exercises, build weekly workout routines, log daily performance, and visualize your progress over time — all stored locally in your browser via IndexedDB.

---

## Features

- **Exercise Management** — Create, edit, and delete exercises with target sets, reps, and muscle groups
- **Routine Builder** — Assign exercises to specific days of the week to build a recurring schedule
- **Daily Checklist** — View today's assigned exercises, mark them complete, and log actual performance (sets, reps, weight, difficulty)
- **Weekly Summary** — See how many workouts were assigned vs. completed for any given week, with a per-day breakdown
- **Progress Graphs** — Visualize reps, weight, and completion rate trends over time per exercise using interactive charts

---

## Tech Stack

| Category         | Technology                        |
|------------------|-----------------------------------|
| Framework        | Vue 3 (Composition API)           |
| Language         | TypeScript (strict mode)          |
| State Management | Pinia                             |
| Local Storage    | Dexie.js (IndexedDB wrapper)      |
| Charts           | Chart.js                          |
| Styling          | Tailwind CSS                      |
| Build Tool       | Vite                              |
| Testing          | Vitest + @vue/test-utils          |

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

The output is written to the `dist/` directory. You can preview the production build locally with:

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

---

## Project Structure

```
workout-app/
├── src/
│   ├── components/         # Vue components (UI + tests co-located)
│   │   ├── ExerciseManager.vue
│   │   ├── RoutineBuilder.vue
│   │   ├── DailyChecklist.vue
│   │   ├── WeeklySummary.vue
│   │   ├── ProgressGraphs.vue
│   │   └── ...
│   ├── models/             # TypeScript data models and interfaces
│   │   ├── Exercise.ts
│   │   ├── Routine.ts
│   │   ├── WorkoutSession.ts
│   │   └── types.ts
│   ├── stores/             # Pinia state stores
│   │   ├── exercises.ts
│   │   ├── routine.ts
│   │   ├── workoutSessions.ts
│   │   └── ui.ts
│   ├── services/           # IndexedDB storage layer
│   │   ├── database.ts
│   │   ├── storage.ts
│   │   └── sync.ts
│   ├── composables/        # Reusable Vue composables
│   │   ├── useAppInitialization.ts
│   │   └── useComputedCache.ts
│   ├── App.vue             # Root component and layout
│   └── main.ts             # App entry point
├── public/
├── index.html
├── vite.config.ts
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
Navigate to **Today** (Daily Checklist) to see exercises scheduled for the current day. Check off each exercise as you complete it. When you mark one complete, you'll be prompted to log actual sets, reps, weight, and a difficulty rating.

### 4. Review Your Week
Navigate to **Summary** to see a weekly overview: total workouts assigned, total completed, completion percentage, and a day-by-day breakdown. Use the week navigator to look back at previous weeks.

### 5. Track Progress
Navigate to **Progress** to view charts for any exercise. Select an exercise and a time range to see how your reps, weight, and weekly completion rate have changed over time.

---

## Data Storage

All data is stored locally in your browser using **IndexedDB** (via Dexie.js). No account or internet connection is required. Data persists across sessions but is tied to the browser profile — clearing browser data will erase it.
