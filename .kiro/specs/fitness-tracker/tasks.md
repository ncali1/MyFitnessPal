# Implementation Plan: Fitness Tracker

## Overview

The Fitness Tracker will be implemented as a client-side web application using Vue 3 with TypeScript, Pinia for state management, and IndexedDB (via Dexie.js) for persistent storage. The implementation follows a layered approach: first establishing core data models and storage, then building UI components, implementing business logic, and finally integrating everything with comprehensive testing.

---

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Initialize Vue 3 project with TypeScript and Vite
    - Create new Vite project with Vue 3 template
    - Configure TypeScript strict mode
    - Set up ESLint and Prettier for code quality
    - _Requirements: 8.1_

  - [x] 1.2 Set up state management with Pinia
    - Install and configure Pinia store
    - Create store structure for exercises, routine, workoutSessions, and UI state
    - Implement store actions and getters
    - _Requirements: 1.5, 2.4, 3.1, 5.1_

  - [x] 1.3 Configure IndexedDB storage layer with Dexie.js
    - Install Dexie.js library
    - Define database schema for exercises, routine, and workout sessions
    - Create storage service with CRUD operations
    - Implement error handling for storage failures
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.4 Set up testing infrastructure
    - Install Vitest and testing utilities
    - Configure test environment and coverage reporting
    - Create test utilities and mock factories
    - _Requirements: 8.3_

  - [x] 1.5 Configure UI framework and styling
    - Install Tailwind CSS and configure
    - Set up responsive design breakpoints
    - Create base component styles and layout
    - _Requirements: 8.2_

- [ ] 2. Core Data Models and Types
  - [x] 2.1 Define TypeScript interfaces for all data models
    - Create Exercise interface with id, name, targetSets, targetReps, targetMuscleGroups, timestamps
    - Create Routine interface with weeklyAssignments structure
    - Create WorkoutSession interface with exercises array and performance data
    - Create WeeklySummary and ProgressData computed interfaces
    - _Requirements: 1.1, 2.1, 3.4, 4.1, 5.1, 6.1_

  - [ ]* 2.2 Write property test for Exercise CRUD Operations
    - **Property 1: Exercise CRUD Operations**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

  - [x] 2.3 Implement Exercise model with validation
    - Create Exercise class with validation methods
    - Implement name, sets, reps, muscle groups validation
    - Add error messages for invalid inputs
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 2.4 Write property test for Exercise List Flatness
    - **Property 2: Exercise List Flatness**
    - **Validates: Requirements 1.2, 1.5**

  - [x] 2.5 Implement Routine model with assignment logic
    - Create Routine class with day-based assignment structure
    - Implement methods for assigning/removing exercises to days
    - Validate day assignments
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.6 Write property test for Routine Assignment and Modification
    - **Property 3: Routine Assignment and Modification**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.7 Implement WorkoutSession model with performance tracking
    - Create WorkoutSession class with exercise performance logging
    - Implement methods for toggling completion and logging performance data
    - Add timestamp tracking for all operations
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.8 Write property test for Daily Checklist Generation
    - **Property 4: Daily Checklist Generation**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.9 Write property test for Performance Data Capture and Storage
    - **Property 5: Performance Data Capture and Storage**
    - **Validates: Requirements 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 3. Storage and Persistence Layer
  - [x] 3.1 Implement IndexedDB storage service
    - Create storage service with methods for exercises, routine, and sessions
    - Implement CRUD operations for each entity
    - Add error handling and retry logic
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 3.2 Implement data synchronization between Pinia store and IndexedDB
    - Create watchers to persist state changes to storage
    - Implement debouncing to avoid excessive writes
    - Add error recovery for failed writes
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 3.3 Implement data loading on app initialization
    - Load all exercises, routine, and sessions from storage on app start
    - Handle corrupted data gracefully
    - Display loading state during initialization
    - _Requirements: 7.4_

  - [ ]* 3.4 Write property test for Data Persistence Round-Trip
    - **Property 9: Data Persistence Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 4. Exercise Management Component
  - [x] 4.1 Create ExerciseList component
    - Display all exercises in a table or card layout
    - Show exercise name, target sets, target reps, muscle groups
    - Implement edit and delete buttons for each exercise
    - _Requirements: 1.5_

  - [x] 4.2 Create ExerciseForm component for create/edit
    - Build form with fields for name, target sets, target reps, muscle groups
    - Implement form validation with error messages
    - Add submit and cancel buttons
    - _Requirements: 1.1, 1.3_

  - [x] 4.3 Create ExerciseManager parent component
    - Manage state for exercise list and form visibility
    - Handle create, edit, and delete operations
    - Dispatch Pinia actions for state updates
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [ ]* 4.4 Write unit tests for ExerciseManager component
    - Test creating exercise with valid data
    - Test editing exercise updates fields
    - Test deleting exercise removes from list
    - Test form validation errors
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 5. Routine Builder Component
  - [x] 5.1 Create WeeklyGrid component
    - Display 7-day grid with day labels (Monday–Sunday)
    - Show exercises assigned to each day
    - Implement day selection and highlighting
    - _Requirements: 2.4_

  - [x] 5.2 Create ExerciseSelector component
    - Display available exercises in dropdown or modal
    - Allow multi-select for assigning multiple exercises to a day
    - Show selected exercises with remove buttons
    - _Requirements: 2.1, 2.2_

  - [x] 5.3 Create RoutineBuilder parent component
    - Manage routine state and day selection
    - Handle exercise assignment and removal
    - Dispatch Pinia actions to update routine
    - Implement save functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.4 Write unit tests for RoutineBuilder component
    - Test assigning exercise to day
    - Test multiple exercises on same day
    - Test removing exercise from day
    - Test routine persistence
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Daily Checklist Component
  - [x] 6.1 Create DaySelector component
    - Display date picker or day navigation
    - Allow selecting current day or previous days
    - Show selected date prominently
    - _Requirements: 3.1_

  - [x] 6.2 Create ChecklistItems component
    - Display exercises assigned to selected day as checklist
    - Show checkboxes for completion status
    - Display exercise name, target sets, target reps
    - _Requirements: 3.1, 3.2_

  - [x] 6.3 Create PerformanceForm component
    - Build form for logging actual sets, reps, weight, difficulty level
    - Implement form validation
    - Add submit and cancel buttons
    - _Requirements: 3.3, 4.1, 4.2, 4.3, 4.4_

  - [x] 6.4 Create DailyChecklist parent component
    - Manage checklist state and selected date
    - Handle exercise completion toggling
    - Show performance form when exercise marked complete
    - Dispatch Pinia actions to save performance data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.5 Write unit tests for DailyChecklist component
    - Test displaying exercises for selected day
    - Test toggling completion status
    - Test performance form validation
    - Test saving performance data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.6 Write property test for Performance Data Prompt on Completion
    - **Property 11: Performance Data Prompt on Completion**
    - **Validates: Requirements 3.3**

- [x] 7. Weekly Summary Component
  - [x] 7.1 Create SummaryStats component
    - Display total assigned workouts for week
    - Display total completed workouts for week
    - Display completion percentage
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Create DayBreakdown component
    - Display per-day completion status (completed/assigned)
    - Show visual indicator for each day (checkmark, X, or empty)
    - _Requirements: 5.2_

  - [x] 7.3 Create WeekNavigator component
    - Allow navigation between weeks (previous/next)
    - Display current week date range
    - _Requirements: 5.5_

  - [x] 7.4 Create WeeklySummary parent component
    - Implement weekly summary calculation logic
    - Manage selected week state
    - Dispatch Pinia actions to fetch summary data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.5 Write unit tests for WeeklySummary calculation
    - Test total assigned count calculation
    - Test total completed count calculation
    - Test completion percentage calculation
    - Test per-day breakdown accuracy
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.6 Write property test for Weekly Summary Calculation
    - **Property 6: Weekly Summary Calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 7.7 Write property test for Weekly Summary Retrieval
    - **Property 7: Weekly Summary Retrieval**
    - **Validates: Requirements 5.5**

- [x] 8. Progress Graphs Component
  - [x] 8.1 Create ExerciseSelector component for graphs
    - Display dropdown of all exercises
    - Allow selecting exercise to view progress for
    - _Requirements: 6.2_

  - [x] 8.2 Create TimeRangeSelector component
    - Display time range options (4 weeks, 12 weeks, custom)
    - Allow custom date range selection
    - _Requirements: 6.6_

  - [x] 8.3 Create RepsChart component
    - Implement line chart showing actual reps over time
    - Use Chart.js for rendering
    - Display weekly data points
    - _Requirements: 6.3_

  - [x] 8.4 Create WeightChart component
    - Implement line chart showing actual weight over time
    - Use Chart.js for rendering
    - Display weekly data points (if applicable)
    - _Requirements: 6.4_

  - [x] 8.5 Create CompletionRateChart component
    - Implement bar chart showing weekly completion rates
    - Use Chart.js for rendering
    - Display completion percentage per week
    - _Requirements: 6.5_

  - [x] 8.6 Create ProgressGraphs parent component
    - Manage selected exercise and time range state
    - Implement graph data generation logic
    - Dispatch Pinia actions to fetch performance data
    - Render all three charts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 8.7 Write unit tests for graph data generation
    - Test reps data aggregation
    - Test weight data aggregation
    - Test completion rate calculation
    - Test time range filtering
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 8.8 Write property test for Progress Graph Data Generation
    - **Property 8: Progress Graph Data Generation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 9. Pinia Store Implementation
  - [x] 9.1 Implement exercises store module
    - Create state for exercises array
    - Implement actions: createExercise, updateExercise, deleteExercise, loadExercises
    - Implement getters: allExercises, exerciseById
    - Add error handling
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 9.2 Implement routine store module
    - Create state for routine with weeklyAssignments
    - Implement actions: assignExercise, removeExercise, loadRoutine, saveRoutine
    - Implement getters: routineForDay, allAssignments
    - Add error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 9.3 Implement workoutSessions store module
    - Create state for sessions array and current session
    - Implement actions: createSession, updateSession, logPerformance, loadSessions
    - Implement getters: sessionByDate, performanceByExercise
    - Add error handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 9.4 Implement UI store module
    - Create state for selectedDate, selectedExercise, timeRange, activeTab
    - Implement actions for updating UI state
    - _Requirements: 3.1, 6.2, 6.6_

  - [ ]* 9.5 Write unit tests for store modules
    - Test state mutations
    - Test action dispatching
    - Test getter calculations
    - Test error handling
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 10. Business Logic and Calculations
  - [x] 10.1 Implement weekly summary calculation logic
    - Create function to calculate total assigned workouts for week
    - Create function to calculate total completed workouts for week
    - Create function to calculate completion percentage
    - Create function to generate per-day breakdown
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Implement progress data aggregation logic
    - Create function to aggregate reps data by week
    - Create function to aggregate weight data by week
    - Create function to calculate weekly completion rates
    - Implement time range filtering
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 10.3 Implement daily checklist generation logic
    - Create function to get exercises for specific day of week
    - Create function to get workout session for specific date
    - Create function to merge routine with session data
    - _Requirements: 3.1, 3.2_

  - [ ]* 10.4 Write unit tests for business logic
    - Test weekly summary calculations with various data
    - Test progress data aggregation
    - Test daily checklist generation
    - Test edge cases (empty data, single entry, etc.)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 11. Navigation and Layout
  - [x] 11.1 Create MainMenu component
    - Display navigation links to all major sections
    - Implement active tab highlighting
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Create App root component
    - Set up main layout with navigation and content area
    - Implement responsive design for desktop and tablet
    - Manage overall app state
    - _Requirements: 8.1, 8.2_

  - [x] 11.3 Implement responsive design
    - Ensure all components adapt to desktop (1920x1080) and tablet (768x1024) viewports
    - Test layout on different screen sizes
    - _Requirements: 8.2_

- [x] 12. Error Handling and Validation
  - [x] 12.1 Implement input validation utilities
    - Create validators for exercise name, sets, reps, muscle groups
    - Create validators for performance data (sets, reps, weight)
    - Create validators for date inputs
    - _Requirements: 1.1, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [x] 12.2 Implement error handling in components
    - Add try-catch blocks for async operations
    - Display user-friendly error messages
    - Implement retry logic for failed operations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.3_

  - [x] 12.3 Implement storage error recovery
    - Handle IndexedDB quota exceeded errors
    - Handle corrupted data on load
    - Implement automatic retry with exponential backoff
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 12.4 Write unit tests for validation and error handling
    - Test validation functions with valid and invalid inputs
    - Test error message generation
    - Test error recovery flows
    - _Requirements: 1.1, 3.3, 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.3, 7.4_

- [x] 13. Performance Optimization
  - [x] 13.1 Implement lazy loading for charts
    - Load chart components only when needed
    - Render charts in background to avoid blocking UI
    - _Requirements: 8.3_

  - [x] 13.2 Implement virtual scrolling for large lists
    - Add virtual scrolling to exercise list if 1000+ exercises
    - Optimize rendering performance
    - _Requirements: 8.3_

  - [x] 13.3 Implement caching for computed data
    - Cache weekly summary calculations
    - Cache progress graph data
    - Invalidate cache on data changes
    - _Requirements: 8.3_

  - [ ]* 13.4 Write performance tests
    - Test page load time (target: < 2 seconds)
    - Test chart rendering time (target: < 2 seconds)
    - Test summary calculation time (target: < 2 seconds)
    - _Requirements: 8.3_

  - [ ]* 13.5 Write property test for Performance Response Time
    - **Property 10: Performance Response Time**
    - **Validates: Requirements 8.3**

- [x] 14. Integration and Wiring
  - [x] 14.1 Wire ExerciseManager to store
    - Connect create/edit/delete operations to Pinia actions
    - Implement automatic persistence to storage
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 7.1_

  - [x] 14.2 Wire RoutineBuilder to store
    - Connect assignment operations to Pinia actions
    - Implement automatic persistence to storage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.2_

  - [x] 14.3 Wire DailyChecklist to store
    - Connect completion toggling to Pinia actions
    - Connect performance logging to Pinia actions
    - Implement automatic persistence to storage
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 7.3_

  - [x] 14.4 Wire WeeklySummary to store
    - Connect summary calculation to store getters
    - Implement week navigation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 14.5 Wire ProgressGraphs to store
    - Connect graph data generation to store getters
    - Implement exercise and time range selection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 14.6 Write integration tests for component interactions
    - Test creating exercise and seeing it in routine builder
    - Test assigning exercise to routine and seeing in daily checklist
    - Test logging performance and seeing in progress graphs
    - Test data persistence across component interactions
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 7.2, 7.3, 7.4_

- [x] 15. End-to-End Testing
  - [x] 15.1 Test complete user workflow: Create exercises
    - Create 3 different exercises with various muscle groups
    - Verify exercises appear in exercise list
    - _Requirements: 1.1, 1.5_

  - [x] 15.2 Test complete user workflow: Build routine
    - Assign exercises to each day of the week
    - Verify routine displays correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 15.3 Test complete user workflow: Log workouts
    - Log workouts for a full week with performance data
    - Verify sessions are saved
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 15.4 Test complete user workflow: View weekly summary
    - View weekly summary for logged week
    - Verify calculations are correct
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 15.5 Test complete user workflow: View progress graphs
    - View progress graphs for logged exercises
    - Verify graphs display correct data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 15.6 Test data persistence across app reload
    - Create data, close app, reopen app
    - Verify all data is loaded and intact
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 15.7 Test responsive design on multiple viewports
    - Test on desktop (1920x1080)
    - Test on tablet (768x1024)
    - Verify layout adapts correctly
    - _Requirements: 8.2_

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure all integration tests pass
  - Ensure all end-to-end tests pass
  - Ask the user if questions arise

- [x] 17. Documentation and Cleanup
  - [x] 17.1 Add JSDoc comments to all functions and components
    - Document parameters, return types, and behavior
    - _Requirements: 8.1_

  - [x] 17.2 Create README with setup and usage instructions
    - Document how to install dependencies
    - Document how to run development server
    - Document how to run tests
    - _Requirements: 8.1_

  - [x] 17.3 Clean up unused code and dependencies
    - Remove any unused imports or variables
    - Verify all dependencies are necessary
    - _Requirements: 8.1_

- [x] 18. Final Checkpoint - Ensure all tests pass and app is ready
  - Ensure all tests pass
  - Verify app loads within 2 seconds
  - Verify all features work as expected
  - Ask the user if questions arise

- [ ] 19. PWA (Progressive Web App) Setup
  - [ ] 19.1 Install and configure vite-plugin-pwa
    - Install `vite-plugin-pwa` as a dev dependency
    - Add plugin to `vite.config.ts` with app manifest settings (name, icons, theme color)
    - Configure service worker strategy (GenerateSW or InjectManifest)
    - _Goal: App is installable from the browser on desktop and mobile_

  - [ ] 19.2 Create app icons and splash assets
    - Generate icons at required sizes (192x192, 512x512 minimum)
    - Add maskable icon variant for Android adaptive icons
    - Place icons in `public/` directory
    - _Goal: App displays a proper icon when installed_

  - [ ] 19.3 Configure offline caching strategy
    - Cache app shell (HTML, JS, CSS) for offline use
    - Cache IndexedDB data is already local — confirm it works offline
    - Test that the app loads without a network connection
    - _Goal: App works fully offline after first load_

  - [ ] 19.4 Add install prompt (optional enhancement)
    - Listen for the `beforeinstallprompt` browser event
    - Show a subtle "Install App" button in the UI
    - _Goal: Users are nudged to install without being intrusive_

  - [ ] 19.5 Verify PWA checklist
    - Run Lighthouse PWA audit in Chrome DevTools
    - Ensure score is 100 (or address any flagged issues)
    - Test "Add to Home Screen" on Android and iOS Safari
    - _Goal: App passes PWA installability requirements_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties across all valid inputs
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions and data flow
- Checkpoints ensure incremental validation and early error detection
- All code should follow Vue 3 and TypeScript best practices
- Responsive design should be tested on desktop and tablet viewports
- Performance targets: page load < 2 seconds, operations < 2 seconds

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "2.7"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6", "2.8", "2.9", "3.1", "9.1", "9.2", "9.3", "9.4"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1", "4.2", "5.1", "5.2", "6.1", "6.2", "6.3", "10.1", "10.2", "10.3"] },
    { "id": 4, "tasks": ["3.4", "4.3", "5.3", "6.4", "7.1", "7.2", "7.3", "8.1", "8.2", "8.3", "8.4", "8.5", "9.5", "11.1", "11.2", "12.1"] },
    { "id": 5, "tasks": ["4.4", "5.4", "6.5", "6.6", "7.4", "8.6", "10.4", "11.3", "12.2", "12.3", "13.1", "13.2", "13.3"] },
    { "id": 6, "tasks": ["7.5", "7.6", "7.7", "8.7", "8.8", "12.4", "13.4", "13.5", "14.1", "14.2", "14.3", "14.4", "14.5"] },
    { "id": 7, "tasks": ["14.6", "15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7"] },
    { "id": 8, "tasks": ["16"] },
    { "id": 9, "tasks": ["17.1", "17.2", "17.3"] },
    { "id": 10, "tasks": ["18"] },
    { "id": 11, "tasks": ["19.1"] },
    { "id": 12, "tasks": ["19.2", "19.3"] },
    { "id": 13, "tasks": ["19.4", "19.5"] }
  ]
}
```
