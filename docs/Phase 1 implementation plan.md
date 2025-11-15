# User

Attached is an initial exploration of technical possibilities for a simple workout web-app. I want you to write an implementation plan I can hand over to a junior engineer to write the first stage of this project. Namely: a sveltekit client only web app. The user should be able to upload workouts in yaml. These will be stored in local storage. The user should be able to tap into a workout to get help running the workout. The features we need at the moment are:
- Rounds
- Sets
- Rests between sets and between rounds
- Names and optional notes for exercises
- Exercises are either time based or reps based
- The user should be able to see their progress during the workout
- A time based exercise will have a countdown. When it hits 0 the app moves to the next exercise
- A reps based exercise only has a 'next' button

# AI

Here is an implementation plan you can hand over to a junior engineer to build the first, client-only version of the workout app using SvelteKit.

-----

## 🚀 Project Implementation Plan: Workout App (Phase 1)

### 1\. Overview & Goals

Your task is to build the initial version of our workout training app. This version will be a **client-side-only SvelteKit application**. The primary goal is to allow a user to paste in a workout plan (in YAML format), have it saved to their browser, and then "run" that workout with a guided interface.

This first phase focuses on the core "runner" logic: handling time-based vs. reps-based exercises, sets, rounds, and rests.

### 2\. Technology Stack

  * **Framework:** SvelteKit (configured for a static, client-side-only app).
  * **Parsing:** `js-yaml` (to parse the workout text).
  * **Storage:** `localStorage`. We'll use the `svelte-persisted-store` library to make this easy.
  * **Styling:** Plain CSS or CSS Modules (keep it simple).
  * **Deployment Target:** GitHub Pages (via `adapter-static`).

### 3\. Core Data Structures

To keep the app predictable, we will use these TypeScript interfaces. Create a file like `src/lib/types.ts` for them.

```typescript
// src/lib/types.ts

// This maps directly to our YAML format
export interface Exercise {
  name: string;
  type: 'time' | 'reps';
  amount: number | string; // e.g., 60 or "60s" for time, 10 for reps
  notes?: string;
  sets?: number;
  rest?: number | string; // e.g., 45 or "45s"
}

export interface Round {
  count: number;
  rest_after_round?: number | string;
  exercises: Exercise[];
}

export interface WorkoutDefinition {
  name: string;
  exercises?: Exercise[];
  rounds?: Round[];
}

// This is the "flattened" step-by-step list we will generate.
// This is the most important data structure for the runner.
export interface WorkoutStep {
  name: string;
  type: 'time' | 'reps';
  amount: number;
  notes?: string;
}
```

### 4\. Step-by-Step Implementation

#### Step 1: Project Setup

1.  **Initialize SvelteKit:**

    ```bash
    npm create svelte@latest workout-app
    ```

      * Choose: "Skeleton project", "Yes, using TypeScript syntax", "ESLint", "Prettier".

2.  **Install Dependencies:**

    ```bash
    cd workout-app
    npm install
    npm install js-yaml svelte-persisted-store
    npm install -D @types/js-yaml
    ```

3.  **Configure for Static (Client-Side) Deployment:**

      * In `svelte.config.js`, import and set the static adapter:
        ```js
        import adapter from '@sveltejs/adapter-static';
        // ...
        kit: {
          adapter: adapter({
            // default options are fine
            pages: 'build',
            assets: 'build',
            fallback: null,
            precompress: false
          })
        }
        ```
      * In the root layout (`src/routes/+layout.ts`), turn off SSR to ensure it's client-only:
        ```typescript
        // src/routes/+layout.ts
        export const ssr = false;
        ```

#### Step 2: Create the `localStorage` Store

Create a file to manage our workouts.

```typescript
// src/lib/stores.ts
import { persisted } from 'svelte-persisted-store';
import type { WorkoutDefinition } from './types';

// This creates a svelte writable store that automatically
// syncs its content to localStorage under the key "user-workouts".
export const workouts = persisted<WorkoutDefinition[]>('user-workouts', []);
```

#### Step 3: Build the Home Page (`src/routes/+page.svelte`)

This page will have two parts: a list of saved workouts and a text area to add new ones.

1.  **Script:**

      * Import `workouts` from `src/lib/stores.ts`.
      * Import `jsyaml` from `js-yaml`.
      * Create a local variable, `yamlInput = ''`, and bind it to a `<textarea>`.
      * Create a function `addWorkout()`:
          * It should be wrapped in a `try...catch` block.
          * Inside the `try`, `const data = jsyaml.load(yamlInput) as { workouts: WorkoutDefinition[] };`
          * Validate that `data` and `data.workouts` exist.
          * Update the store: `workouts.update(currentWorkouts => [...currentWorkouts, ...data.workouts]);`
          * Clear the `yamlInput` text area.
          * If it fails, `alert('Invalid YAML format!')`.

2.  **Markup:**

      * Show a `<h2>My Workouts</h2>`.
      * Loop through the store: `{#each $workouts as workout (workout.name)}`.
      * Inside the loop, create a link: `<a href="/workout/{encodeURIComponent(workout.name)}">{workout.name}</a>`.
      * Show an `<h2>Add New Workout</h2>`.
      * Add the `<textarea bind:value={yamlInput}></textarea>`.
      * Add a `<button on:click={addWorkout}>Save Workout</button>`.

#### Step 4: Create the Workout "Unroller" (Core Logic)

This is the most critical piece of logic. Create a new file for this helper function.

  * **Goal:** Convert a `WorkoutDefinition` (with rounds/sets) into a simple, flat array of `WorkoutStep[]` (e.g., `[Push-ups, Rest, Push-ups, Rest, Squats, Rest]`).

<!-- end list -->

```typescript
// src/lib/workoutUnroller.ts
import type { WorkoutDefinition, Exercise, Round, WorkoutStep } from './types';

// Helper to parse "60s" or 60 into a number
function parseTime(time: string | number | undefined): number {
  if (typeof time === 'number') return time;
  if (typeof time === 'string') return parseInt(time, 10);
  return 0;
}

export function unrollWorkout(workout: WorkoutDefinition): WorkoutStep[] {
  const steps: WorkoutStep[] = [];

  const addExercise = (ex: Exercise) => {
    const sets = ex.sets || 1;
    const restTime = parseTime(ex.rest);

    for (let i = 0; i < sets; i++) {
      // 1. Add the exercise step
      steps.push({
        name: ex.name,
        type: ex.type,
        amount: ex.type === 'time' ? parseTime(ex.amount) : (ex.amount as number),
        notes: ex.notes,
      });

      // 2. Add rest, but only if rest is defined AND it's not the last set
      if (restTime > 0 && i < sets - 1) {
        steps.push({
          name: 'Rest',
          type: 'time',
          amount: restTime,
          notes: `Rest after set ${i + 1} of ${ex.name}`,
        });
      }
    }
  };

  // --- Main Unrolling Logic ---

  if (workout.exercises) {
    // Simple list of exercises
    for (const ex of workout.exercises) {
      addExercise(ex);
    }
  } else if (workout.rounds) {
    // List of rounds
    for (const round of workout.rounds) {
      const restAfterRound = parseTime(round.rest_after_round);

      for (let i = 0; i < round.count; i++) {
        // Add all exercises in the round
        for (const ex of round.exercises) {
          addExercise(ex);
        }

        // Add rest after the round, but not after the final round
        if (restAfterRound > 0 && i < round.count - 1) {
          steps.push({
            name: 'Round Rest',
            type: 'time',
            amount: restAfterRound,
            notes: `Rest after round ${i + 1}`,
          });
        }
      }
    }
  }

  return steps;
}
```

#### Step 5: Build the Workout Runner Page (`src/routes/workout/[slug]/+page.svelte`)

This is the dynamic page that runs the workout.

1.  **Script (`<script lang="ts">`)**

      * **Imports:**
        ```typescript
        import { page } from '$app/stores';
        import { workouts } from '$lib/stores';
        import { unrollWorkout } from '$lib/workoutUnroller';
        import type { WorkoutStep } from '$lib/types';
        import { onMount, onDestroy } from 'svelte';
        ```
      * **State:**
        ```typescript
        let unrolledSteps: WorkoutStep[] = [];
        let currentStepIndex = 0;
        let timerValue = 0;
        let timerInterval: number; // To store the interval ID
        let isPaused = true;

        // Reactive:
        $: currentStep = unrolledSteps[currentStepIndex];
        $: isWorkoutDone = currentStep === undefined;
        ```
      * **Load Data:**
        ```typescript
        onMount(() => {
          const workoutName = decodeURIComponent($page.params.slug);
          const workout = $workouts.find(w => w.name === workoutName);

          if (workout) {
            unrolledSteps = unrollWorkout(workout);
            // Wait for user to press "Start"
          } else {
            // Handle workout not found (e.g., redirect)
          }
        });
        ```
      * **Core Functions:**
        ```typescript
        function startTimer() {
          isPaused = false;
          timerValue = currentStep.amount;

          timerInterval = setInterval(() => {
            timerValue--;
            if (timerValue <= 0) {
              advanceToNextStep();
              // Optional: Play a sound
            }
          }, 1000);
        }

        function advanceToNextStep() {
          clearInterval(timerInterval); // Stop any running timer
          isPaused = true;

          if (currentStepIndex < unrolledSteps.length - 1) {
            currentStepIndex++;
            // If the *new* step is time-based, start it automatically
            if (currentStep.type === 'time') {
              startTimer();
            }
          } else {
            currentStepIndex++; // This will trigger the `isWorkoutDone` flag
          }
        }

        function handleStartPause() {
          if (currentStep.type !== 'time') {
             // For reps-based, this is the "Next" button
             advanceToNextStep();
             return;
          }

          if (isPaused) {
            // If it's a new step, start the timer
            if (timerValue === 0) {
               startTimer();
            } else {
               // If it was paused, resume
               isPaused = false;
               startTimer(); // This restarts the interval
            }
          } else {
            // Pause
            isPaused = true;
            clearInterval(timerInterval);
          }
        }

        // Cleanup
        onDestroy(() => {
          clearInterval(timerInterval);
        });
        ```

2.  **Markup (The UI):**

      * Check for loading: `{#if !currentStep && !isWorkoutDone}`...
      * Show "Workout Complete\!": `{#if isWorkoutDone}`...
      * **The Main Runner:** `{:else if currentStep}`
          * **Progress:** `<h2>Step {currentStepIndex + 1} of {unrolledSteps.length}</h2>`
          * **Exercise Name:** `<h1>{currentStep.name}</h1>`
          * **Notes:** `{#if currentStep.notes}<p>{currentStep.notes}</p>{/if}`
          * **Conditional Display:**
            ```svelte
            {#if currentStep.type === 'time'}
              <div class="timer-display">
                {timerValue > 0 ? timerValue : currentStep.amount}s
              </div>
            {:else}
              <div class="reps-display">
                {currentStep.amount} reps
              </div>
            {/if}
            ```
          * **Controls:**
            ```svelte
            <button class="main-control" on:click={handleStartPause}>
              {#if currentStep.type === 'reps'}
                Next
              {:else if isPaused}
                Start
              {:else}
                Pause
              {/if}
            </button>
            ```

### 5\. What "Done" Looks Like (Acceptance Criteria)

  * [ ] The user can paste the YAML from the prompt and see it added to a list.
  * [ ] The list of workouts persists after refreshing the page.
  * [ ] Clicking a workout from the list navigates to the `/workout/[name]` page.
  * [ ] The workout page correctly "unrolls" a workout with rounds, sets, and rests.
  * [ ] The user can see their progress (e.g., "Step 3 of 15").
  * [ ] For a **time-based** exercise, clicking "Start" begins a countdown.
  * [ ] When the countdown hits 0, the app automatically advances to the next step.
  * [ ] For a **reps-based** exercise, the app shows a "Next" button.
  * [ ] Clicking "Next" advances to the next step.
  * [ ] A "Workout Complete" message appears at the end.