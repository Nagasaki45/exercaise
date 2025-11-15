<script lang="ts">
  import { page } from '$app/stores';
  import { workouts } from '$lib/stores';
  import { unrollWorkout } from '$lib/workoutUnroller';
  import type { WorkoutStep } from '$lib/types';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';

  let unrolledSteps: WorkoutStep[] = [];
  let currentStepIndex = 0;
  let timerValue = 0;
  let timerInterval: number; // To store the interval ID
  let isPaused = true;

  // Reactive:
  $: currentStep = unrolledSteps[currentStepIndex];
  $: isWorkoutDone = currentStep === undefined && unrolledSteps.length > 0;
  $: displayTimerValue = timerValue > 0 ? timerValue : (currentStep?.type === 'time' ? currentStep.amount : 0);


  onMount(() => {
    const slug = $page.params.slug;
    if (!slug) {
      goto('/'); // Redirect to home if slug is undefined
      return;
    }
    const workoutName = decodeURIComponent(slug);
    const workout = $workouts.find(w => w.name === workoutName);

    if (workout) {
      unrolledSteps = unrollWorkout(workout);
      // Initialize timerValue for the first step if it's time-based
      if (unrolledSteps.length > 0 && unrolledSteps[0].type === 'time') {
        timerValue = unrolledSteps[0].amount;
      }
    } else {
      // Handle workout not found (e.g., redirect to home)
      goto('/');
    }
  });

  function startTimer() {
    isPaused = false;
    if (timerValue <= 0 && currentStep.type === 'time') {
        timerValue = currentStep.amount;
    }

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

    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex < unrolledSteps.length) {
      currentStepIndex = nextStepIndex;

      // IMPORTANT: Use the new step directly from the array to avoid reactivity timing issues
      const nextStep = unrolledSteps[nextStepIndex];

      if (nextStep.type === 'time') {
        timerValue = nextStep.amount;
        startTimer(); // This sets isPaused = false
      } else {
        // If the new step is reps-based, we are now "paused" waiting for user input
        isPaused = true;
        timerValue = 0;
      }
    } else {
      currentStepIndex++; // This will trigger the `isWorkoutDone` flag
      isPaused = true;
      timerValue = 0; // Ensure timer is 0 when done
    }
  }

  function handleStartPause() {
    if (!currentStep) return; // Should not happen if workout is not done

    if (currentStep.type === 'reps') {
       // For reps-based, this is the "Next" button
       advanceToNextStep();
       return;
    }

    // For time-based exercises
    if (isPaused) {
      startTimer();
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
</script>

<style>
  .container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
    font-family: sans-serif;
    text-align: center;
  }

  h1 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }

  h2 {
    color: #555;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  p {
    color: #666;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .timer-display, .reps-display {
    font-size: 5rem;
    font-weight: bold;
    color: #007bff;
    margin: 2rem 0;
  }

  .main-control {
    background-color: #28a745;
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.8rem;
    min-width: 200px;
  }

  .main-control:hover {
    background-color: #218838;
  }

  .main-control.pause {
    background-color: #ffc107;
    color: #333;
  }

  .main-control.pause:hover {
    background-color: #e0a800;
  }

  .workout-complete {
    font-size: 2rem;
    color: #28a745;
    margin-top: 3rem;
  }
</style>

<div class="container">
  {#if !currentStep && !isWorkoutDone}
    <p>Loading workout...</p>
  {:else if isWorkoutDone}
    <h1 class="workout-complete">Workout Complete! 🎉</h1>
    <button on:click={() => goto('/')} class="main-control">Go Home</button>
  {:else if currentStep}
    <h2>Step {currentStepIndex + 1} of {unrolledSteps.length}</h2>
    <h1>{currentStep.name}</h1>
    {#if currentStep.notes}
      <p>{currentStep.notes}</p>
    {/if}

    {#if currentStep.type === 'time'}
      <div class="timer-display">
        {displayTimerValue}s
      </div>
    {:else}
      <div class="reps-display">
        {currentStep.amount} reps
      </div>
    {/if}

    <button
      class="main-control"
      class:pause={currentStep.type === 'time' && !isPaused}
      on:click={handleStartPause}
    >
      {#if currentStep.type === 'reps'}
        Next
      {:else if isPaused}
        Start
      {:else}
        Pause
      {/if}
    </button>
  {/if}
</div>