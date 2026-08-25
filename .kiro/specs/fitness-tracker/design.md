# Fitness Tracker Design Document

## Overview

The Fitness Tracker is a web-based fitness management system that enables users to define personalized exercises, organize them into a weekly routine, log daily workout performance, and visualize progress over time. The system provides a clean, responsive interface for tracking fitness activities with comprehensive data persistence.

### Key Design Goals

- **Simplicity**: Straightforward exercise and routine management without complex categorization
- **Accountability**: Daily checklist-based tracking with performance logging
- **Insight**: Visual progress tracking through graphs and weekly summaries
- **Accessibility**: Web-based interface responsive across desktop and tablet devices
- **Reliability**: Persistent data storage ensuring no loss of user progress

### Core User Workflows

1. **Setup Phase**: Create exercises with target metrics, assign to weekly routine
2. **Daily Logging**: Check off completed exercises, log actual performance
3. **Review Phase**: View weekly summaries and progress graphs to monitor improvements

---

## Architecture

### System Overview

The Fitness Tracker follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (Client)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React/Vue Component Layer                    │   │
│  │  (Exercise Management, Routine, Daily Checklist)     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         State Management (Vuex/Redux)                │   │
│  │  (Exercises, Routine, Workout Sessions, UI State)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Local Storage / IndexedDB                     │   │
│  │  (Offline-first data persistence)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓ (Optional: Future Backend Integration)
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         REST API / GraphQL                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Business Logic Layer                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Database (PostgreSQL/MongoDB)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Recommendations

**Frontend**:
- **Framework**: Vue 3 or React 18+ (component-based, reactive)
- **State Management**: Pinia (Vue) or Redux Toolkit (React)
- **Charting**: Chart.js or D3.js for progress visualization
- **Storage**: IndexedDB with a wrapper library (Dexie.js) for offline-first persistence
- **Styling**: Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development and optimized builds

**Backend (Optional, for future scaling)**:
- **Runtime**: Node.js with Express or Fastify
- **Database**: PostgreSQL for relational data (exercises, routines, sessions)
- **ORM**: Prisma or TypeORM for database abstraction
- **API**: REST with JSON or GraphQL

**Development**:
- **Testing**: Vitest (unit), Cypress (E2E)
- **Linting**: ESLint + Prettier
- **Version Control**: Git

### Deployment Architecture

- **Frontend**: Static hosting (Vercel, Netlify, GitHub Pages)
- **Backend**: Cloud platform (AWS, Heroku, DigitalOcean) - future consideration
- **Database**: Managed database service or self-hosted

---

## Components and Interfaces

### Frontend Component Structure

```
App
├── ExerciseManager
│   ├── ExerciseList
│   ├── ExerciseForm (Create/Edit)
│   └── ExerciseDetail
├── RoutineBuilder
│   ├── WeeklyGrid
│   ├── DayAssignment
│   └── ExerciseSelector
├── DailyChecklist
│   ├── DaySelector
│   ├── ChecklistItems
│   ├── PerformanceForm
│   └── PerformanceHistory
├── WeeklySummary
│   ├── SummaryStats
│   ├── DayBreakdown
│   └── WeekNavigator
├── ProgressGraphs
│   ├── ExerciseSelector
│   ├── TimeRangeSelector
│   ├── RepsChart
│   ├── WeightChart
│   └── CompletionRateChart
└── Navigation
    └── MainMenu
```

### Key Component Interfaces

#### ExerciseManager Component
- **Props**: None (root component)
- **State**: exercises[], selectedExercise
- **Methods**: createExercise(), editExercise(), deleteExercise(), loadExercises()
- **Emits**: exerciseCreated, exerciseUpdated, exerciseDeleted

#### RoutineBuilder Component
- **Props**: exercises[]
- **State**: routine{}, selectedDay
- **Methods**: assignExercise(), removeExercise(), saveRoutine(), loadRoutine()
- **Emits**: routineUpdated

#### DailyChecklist Component
- **Props**: routine{}, selectedDate
- **State**: workoutSession{}, completedExercises[]
- **Methods**: toggleExercise(), logPerformance(), saveSession(), loadSession()
- **Emits**: sessionSaved

#### ProgressGraphs Component
- **Props**: workoutSessions[]
- **State**: selectedExercise, timeRange
- **Methods**: generateRepsChart(), generateWeightChart(), generateCompletionChart()
- **Emits**: None

---

## Data Models

### Core Entities

#### Exercise
```
{
  id: UUID,
  name: string,
  targetSets: number,
  targetReps: number,
  targetMuscleGroups: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Routine
```
{
  id: UUID,
  userId: UUID (future),
  weeklyAssignments: {
    monday: [exerciseId],
    tuesday: [exerciseId],
    wednesday: [exerciseId],
    thursday: [exerciseId],
    friday: [exerciseId],
    saturday: [exerciseId],
    sunday: [exerciseId]
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### WorkoutSession
```
{
  id: UUID,
  date: date,
  exercises: [
    {
      exerciseId: UUID,
      completed: boolean,
      actualSets: number,
      actualReps: number,
      weight: number (nullable),
      difficultyLevel: enum('easy', 'moderate', 'hard'),
      timestamp: timestamp
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### WeeklySummary (Computed)
```
{
  weekStartDate: date,
  weekEndDate: date,
  totalAssignedWorkouts: number,
  totalCompletedWorkouts: number,
  completionPercentage: number,
  dailyBreakdown: {
    monday: { assigned: number, completed: number },
    tuesday: { assigned: number, completed: number },
    ...
  }
}
```

#### ProgressData (Computed)
```
{
  exerciseId: UUID,
  exerciseName: string,
  timeRange: {
    startDate: date,
    endDate: date
  },
  weeklyData: [
    {
      weekStartDate: date,
      averageReps: number,
      averageWeight: number,
      completionCount: number,
      totalAssigned: number
    }
  ]
}
```

### Database Schema (Future Backend)

```sql
-- Exercises Table
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps INTEGER NOT NULL,
  target_muscle_groups TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routines Table
CREATE TABLE routines (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routine Assignments Table
CREATE TABLE routine_assignments (
  id UUID PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES routines(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  day_of_week INTEGER NOT NULL (0-6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout Sessions Table
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout Session Exercises Table
CREATE TABLE workout_session_exercises (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES workout_sessions(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  completed BOOLEAN DEFAULT FALSE,
  actual_sets INTEGER,
  actual_reps INTEGER,
  weight DECIMAL(8,2),
  difficulty_level VARCHAR(20),
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_date ON workout_sessions(user_id, session_date);
CREATE INDEX idx_routine_assignments_routine ON routine_assignments(routine_id);
```

### State Management Structure

```javascript
// Pinia Store (Vue) or Redux Store (React)
{
  exercises: {
    items: Exercise[],
    loading: boolean,
    error: string | null
  },
  routine: {
    current: Routine,
    loading: boolean,
    error: string | null
  },
  workoutSessions: {
    items: WorkoutSession[],
    currentSession: WorkoutSession | null,
    loading: boolean,
    error: string | null
  },
  ui: {
    selectedDate: date,
    selectedExercise: UUID | null,
    timeRange: { start: date, end: date },
    activeTab: string
  }
}
```

---

## User Interface Flows

### Exercise Management Flow
1. User navigates to "Exercises" section
2. System displays list of all exercises
3. User can:
   - Click "Add Exercise" → Form opens → User enters name, sets, reps, muscle groups → System saves
   - Click exercise → Detail view opens → User can edit or delete
   - Delete exercise → Confirmation dialog → System removes from exercises and routine

### Routine Setup Flow
1. User navigates to "Weekly Routine"
2. System displays 7-day grid with empty slots
3. User selects a day (e.g., Monday)
4. System shows available exercises
5. User selects exercises to assign to that day
6. System updates the grid and saves routine

### Daily Logging Flow
1. User navigates to "Today's Workout" or selects a specific date
2. System displays checklist of exercises assigned to that day
3. For each exercise, user can:
   - Mark as completed → Performance form appears
   - Enter actual sets, reps, weight, difficulty
   - Save → System stores performance data
4. User can view/edit previously logged sessions

### Progress Viewing Flow
1. User navigates to "Progress"
2. System displays exercise selector dropdown
3. User selects an exercise
4. System displays time range selector (4 weeks, 12 weeks, custom)
5. System renders three charts:
   - Reps over time (line chart)
   - Weight over time (line chart, if applicable)
   - Weekly completion rate (bar chart)

---

## API Endpoints (Future Backend)

### Exercise Endpoints
- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create new exercise
- `GET /api/exercises/:id` - Get exercise details
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Routine Endpoints
- `GET /api/routine` - Get current routine
- `PUT /api/routine` - Update routine
- `POST /api/routine/assign` - Assign exercise to day
- `DELETE /api/routine/assign/:id` - Remove exercise from day

### Workout Session Endpoints
- `GET /api/sessions` - List sessions (with date range filter)
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `POST /api/sessions/:id/exercises` - Log exercise performance

### Summary & Analytics Endpoints
- `GET /api/summary/weekly` - Get weekly summary
- `GET /api/summary/weekly/:date` - Get summary for specific week
- `GET /api/progress/:exerciseId` - Get progress data for exercise

---

## Integration Points

### Client-to-Storage Integration
- **IndexedDB Wrapper**: Dexie.js provides promise-based API for local storage
- **Sync Strategy**: Automatic save on every state change (debounced)
- **Offline Support**: Full functionality offline; sync to backend when available

### Component-to-State Integration
- **State Mutations**: Components dispatch actions to update state
- **Computed Properties**: Derived data (summaries, graphs) computed from base state
- **Watchers**: Automatic persistence when state changes

### Chart Library Integration
- **Chart.js**: Renders reps, weight, and completion rate charts
- **Data Transformation**: Convert WorkoutSession data to chart-compatible format
- **Responsive**: Charts resize with container

### Future Backend Integration
- **API Client**: Axios or Fetch wrapper for HTTP requests
- **Authentication**: JWT tokens for user sessions
- **Sync Queue**: Queue offline changes, sync when connection restored
- **Conflict Resolution**: Last-write-wins strategy for concurrent updates

---

## Error Handling

### User-Facing Errors
- **Validation Errors**: Display inline form validation messages
- **Storage Errors**: Show toast notification if local storage fails
- **Network Errors** (future): Retry logic with exponential backoff

### System Errors
- **Data Corruption**: Validate data on load; reset to empty state if corrupted
- **Missing Data**: Graceful degradation (e.g., show empty chart if no data)
- **Performance Issues**: Lazy load charts; paginate large lists

### Error Recovery
- **Automatic Retry**: Retry failed operations after 1-5 seconds
- **User Notification**: Clear error messages with suggested actions
- **Fallback States**: Maintain UI functionality even if some features fail

---

## Testing Strategy

### Unit Testing
- **Exercise Management**: Test CRUD operations, validation
- **Routine Logic**: Test day assignments, exercise removal
- **Data Calculations**: Test weekly summary calculations, progress data aggregation
- **State Management**: Test store mutations and actions
- **Utilities**: Test date calculations, data transformations

### Integration Testing
- **Component Integration**: Test component interactions (e.g., selecting exercise updates form)
- **Storage Integration**: Test data persistence and retrieval
- **State-to-UI**: Test that state changes reflect in UI

### End-to-End Testing
- **User Workflows**: Test complete flows (create exercise → assign to routine → log workout → view progress)
- **Data Persistence**: Verify data survives page reload
- **Responsive Design**: Test on desktop and tablet viewports

### Performance Testing
- **Load Time**: Verify page loads within 2 seconds
- **Chart Rendering**: Verify charts render smoothly with large datasets
- **Storage Limits**: Test with maximum expected data volume



---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following redundancies were identified and consolidated:

- **Exercise CRUD Properties**: Requirements 1.1, 1.3, 1.4 all test exercise modification. These are consolidated into a single property that covers create, update, and delete operations.
- **Routine Assignment Properties**: Requirements 2.1, 2.2, 2.3 all test routine assignment logic. These are consolidated into a single property covering assignment and modification.
- **Performance Data Capture**: Requirements 4.1-4.4 all test capturing different fields of performance data. These are consolidated into a single property that verifies all fields are captured together.
- **Weekly Summary Calculations**: Requirements 5.3-5.4 both test calculations on the same data. These are consolidated into a single property.
- **Progress Graph Data**: Requirements 6.1, 6.3-6.5 all test graph data generation. These are consolidated into a single property.
- **Data Persistence Round-Trip**: Requirement 7.4 is a round-trip property that subsumes 7.1-7.3 (if data survives close/reopen, it must have been persisted).

### Correctness Properties

### Property 1: Exercise CRUD Operations

*For any* exercise with valid name, target sets, target reps, and muscle groups, creating it should result in the exercise being stored and retrievable; modifying any field should persist the change; deleting it should remove it from the exercise list.

**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

### Property 2: Exercise List Flatness

*For any* collection of exercises, the storage structure should be a flat list without nested categories or grouping, and all exercises should be retrievable in a single query.

**Validates: Requirements 1.2, 1.5**

### Property 3: Routine Assignment and Modification

*For any* exercise and day of the week, assigning the exercise to that day should result in the assignment being stored; multiple exercises can be assigned to the same day; modifying assignments should persist the changes; retrieving assignments for a day should return all assigned exercises.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: Daily Checklist Generation

*For any* date and routine, retrieving the checklist for that date should return all exercises assigned to that day of the week; toggling completion status should persist the change.

**Validates: Requirements 3.1, 3.2**

### Property 5: Performance Data Capture and Storage

*For any* completed exercise, logging actual sets, reps, weight (optional), and difficulty level should result in all provided fields being stored with a timestamp; editing previously logged data should persist the changes.

**Validates: Requirements 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 6: Weekly Summary Calculation

*For any* week with assigned and completed exercises, the weekly summary should correctly calculate total assigned workouts, total completed workouts, and completion percentage (completed / assigned); the summary should show per-day completion status.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 7: Weekly Summary Retrieval

*For any* date, the system should be able to retrieve the weekly summary for the week containing that date; summaries for previous weeks should be retrievable and accurate.

**Validates: Requirements 5.5**

### Property 8: Progress Graph Data Generation

*For any* exercise and time range, the system should generate graph data containing actual reps over time, actual weight over time (if applicable), and weekly completion rates; filtering by time range should exclude data outside the range.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 9: Data Persistence Round-Trip

*For any* exercise, routine assignment, or workout session, saving the data and then closing and reopening the application should result in all data being loaded and retrievable in its original form.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 10: Performance Response Time

*For any* user interaction (create exercise, log workout, view summary, generate graph), the system should respond within 2 seconds.

**Validates: Requirements 8.3**

### Property 11: Performance Data Prompt on Completion

*For any* exercise marked as completed, the system should require performance data (sets, reps, difficulty level) before allowing the session to be saved.

**Validates: Requirements 3.3**



---

## Error Handling

### Input Validation Errors

**Exercise Creation/Editing**:
- Empty or whitespace-only name: Display "Exercise name is required"
- Invalid target sets/reps (non-positive integers): Display "Sets and reps must be positive numbers"
- Empty muscle groups: Display "At least one muscle group must be selected"
- Duplicate exercise name: Display "An exercise with this name already exists"

**Performance Logging**:
- Negative or zero sets/reps: Display "Sets and reps must be positive numbers"
- Invalid weight (negative): Display "Weight must be a positive number"
- Missing difficulty level: Display "Difficulty level is required"
- Missing required fields: Disable save button until all required fields are filled

### Storage Errors

**IndexedDB Failures**:
- Quota exceeded: Display "Storage limit reached. Please delete old data or clear browser cache"
- Corrupted data on load: Log error, reset to empty state, display "Data was corrupted and has been reset"
- Failed write operation: Retry up to 3 times with exponential backoff (100ms, 500ms, 1000ms)

**Data Integrity**:
- Missing exercise referenced in routine: Remove the reference, log warning
- Missing exercise referenced in session: Display "Exercise data is missing" in session view
- Invalid date in session: Skip session in calculations, log warning

### Performance Issues

**Slow Operations**:
- Chart rendering with large datasets: Show loading spinner, render in background
- List rendering with 1000+ exercises: Implement virtual scrolling
- Summary calculation timeout: Cache results, update asynchronously

### User-Facing Error Messages

All errors should follow this pattern:
1. Clear description of what went wrong
2. Suggested action to resolve
3. Option to retry or dismiss

Example: "Failed to save workout. Please check your connection and try again. [Retry] [Dismiss]"

---

## Testing Strategy

### Unit Testing

**Exercise Management Tests**:
- Test creating exercise with valid data stores all fields correctly
- Test editing exercise updates only specified fields
- Test deleting exercise removes it from list
- Test creating exercise with invalid data rejects with appropriate error
- Test exercise list remains flat (no nested structures)

**Routine Logic Tests**:
- Test assigning exercise to day stores assignment correctly
- Test multiple exercises can be assigned to same day
- Test removing assignment deletes only that assignment
- Test retrieving assignments for a day returns all assigned exercises
- Test modifying routine persists changes

**Workout Session Tests**:
- Test creating session for a date stores all exercises for that day
- Test toggling completion status persists change
- Test logging performance data stores all fields with timestamp
- Test editing performance data updates only specified fields
- Test session for date with no routine returns empty checklist

**Calculation Tests**:
- Test weekly summary correctly counts assigned workouts
- Test weekly summary correctly counts completed workouts
- Test completion percentage calculation: (completed / assigned) * 100
- Test per-day breakdown shows correct completion status
- Test summary for week with no sessions shows 0 completed

**Graph Data Tests**:
- Test progress data includes all reps logged for exercise
- Test progress data includes all weights logged for exercise
- Test progress data excludes exercises not matching filter
- Test time range filter excludes data outside range
- Test completion rate calculation per week
- Test graph data handles exercises with no performance data

**Storage Tests**:
- Test exercise persists to storage
- Test routine persists to storage
- Test workout session persists to storage
- Test data retrieval returns exact same data as stored
- Test corrupted data is detected and handled

### Property-Based Testing

Each property-based test should run minimum 100 iterations with randomized inputs.

**Property 1: Exercise CRUD Operations**
- **Feature**: fitness-tracker, **Property 1**: Exercise CRUD Operations
- Generate random exercise data (name, sets, reps, muscle groups)
- Create exercise, verify it's stored and retrievable
- Modify each field, verify changes persist
- Delete exercise, verify it's removed from list

**Property 2: Exercise List Flatness**
- **Feature**: fitness-tracker, **Property 2**: Exercise List Flatness
- Generate multiple random exercises
- Store all exercises
- Verify storage structure is flat (no nesting)
- Verify all exercises retrievable in single query

**Property 3: Routine Assignment and Modification**
- **Feature**: fitness-tracker, **Property 3**: Routine Assignment and Modification
- Generate random exercises and days
- Assign exercises to days, verify assignments stored
- Assign multiple exercises to same day, verify all stored
- Modify assignments, verify changes persist
- Retrieve assignments, verify all returned

**Property 4: Daily Checklist Generation**
- **Feature**: fitness-tracker, **Property 4**: Daily Checklist Generation
- Generate random routine and date
- Create routine with assignments
- Retrieve checklist for date, verify exercises match day of week
- Toggle completion, verify change persists

**Property 5: Performance Data Capture and Storage**
- **Feature**: fitness-tracker, **Property 5**: Performance Data Capture and Storage
- Generate random performance data (sets, reps, weight, difficulty)
- Log performance, verify all fields stored with timestamp
- Edit performance, verify changes persist
- Retrieve performance, verify data matches what was stored

**Property 6: Weekly Summary Calculation**
- **Feature**: fitness-tracker, **Property 6**: Weekly Summary Calculation
- Generate random routine and workout sessions for a week
- Calculate summary, verify total assigned count correct
- Verify total completed count correct
- Verify completion percentage = (completed / assigned) * 100
- Verify per-day breakdown accurate

**Property 7: Weekly Summary Retrieval**
- **Feature**: fitness-tracker, **Property 7**: Weekly Summary Retrieval
- Generate random dates and workout data
- Retrieve summary for current week, verify accuracy
- Retrieve summary for previous weeks, verify accuracy
- Verify summaries for different weeks don't interfere

**Property 8: Progress Graph Data Generation**
- **Feature**: fitness-tracker, **Property 8**: Progress Graph Data Generation
- Generate random performance data across multiple weeks
- Generate graph data for exercise, verify includes all reps
- Verify includes all weights (if applicable)
- Verify time range filter excludes out-of-range data
- Verify completion rate calculated per week

**Property 9: Data Persistence Round-Trip**
- **Feature**: fitness-tracker, **Property 9**: Data Persistence Round-Trip
- Generate random exercises, routine, and sessions
- Store all data
- Simulate app close/reopen (clear memory, reload from storage)
- Verify all data loaded and matches original

**Property 10: Performance Response Time**
- **Feature**: fitness-tracker, **Property 10**: Performance Response Time
- Generate random data (exercises, sessions, etc.)
- Measure time for create exercise operation, verify < 2 seconds
- Measure time for log workout operation, verify < 2 seconds
- Measure time for generate summary, verify < 2 seconds
- Measure time for generate graph, verify < 2 seconds

**Property 11: Performance Data Prompt on Completion**
- **Feature**: fitness-tracker, **Property 11**: Performance Data Prompt on Completion
- Generate random exercise and session
- Mark exercise as completed without performance data
- Verify system prevents save without performance data
- Add performance data, verify save succeeds

### Integration Testing

**Component Integration**:
- Test ExerciseManager → ExerciseForm → Storage: Create exercise flows through form to storage
- Test RoutineBuilder → DailyChecklist: Routine assignments appear in checklist
- Test DailyChecklist → ProgressGraphs: Logged performance appears in graphs
- Test WeeklySummary → ProgressGraphs: Summary data matches graph data

**Storage Integration**:
- Test state changes trigger storage updates
- Test storage updates trigger state changes
- Test concurrent operations don't corrupt data

### End-to-End Testing

**Complete User Workflows**:
1. Create 3 exercises → Assign to routine → Log workouts for a week → View weekly summary → View progress graph
2. Edit exercise → Verify changes in routine and sessions
3. Delete exercise → Verify removed from routine and sessions
4. Close app → Reopen → Verify all data persists

**Data Persistence**:
- Create data → Close browser tab → Reopen → Verify data loads
- Create data → Clear browser cache → Verify data lost (expected)

**Responsive Design**:
- Test on desktop (1920x1080): All components visible, no horizontal scroll
- Test on tablet (768x1024): Layout adapts, touch interactions work
- Test on mobile (375x667): Stacked layout, readable text

### Performance Testing

**Load Testing**:
- Create 1000 exercises: Verify list loads within 2 seconds
- Create 52 weeks of workout data: Verify summary loads within 2 seconds
- Generate graph with 52 weeks of data: Verify renders within 2 seconds

**Memory Testing**:
- Monitor memory usage with 1000 exercises
- Monitor memory usage with 52 weeks of data
- Verify no memory leaks on repeated operations

### Accessibility Testing

**Keyboard Navigation**:
- All interactive elements accessible via Tab key
- Forms submittable via Enter key
- Modals closable via Escape key

**Screen Reader Testing**:
- Form labels associated with inputs
- Buttons have descriptive text
- Charts have text alternatives

