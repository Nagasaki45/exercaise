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
  let wakeLockSentinel: WakeLockSentinel | null = null;
  let audioContext: AudioContext | null = null;

  function playBell() {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1);

    const oscillator = audioContext.createOscillator();
    oscillator.connect(gainNode);
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.start(now);
    oscillator.stop(now + 1);
  }

  function announceNextExercise() {
    const toSay = nextStep ? `Next up: ${nextStep.name}` : 'You did it!';
    const utterance = new SpeechSynthesisUtterance(toSay);
    speechSynthesis.speak(utterance);
  }

  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock activated.');
        wakeLockSentinel.addEventListener('release', () => {
          console.log('Screen Wake Lock released automatically.');
        });
      } catch (err: any) {
        console.error(`Failed to activate wake lock: ${err.name}, ${err.message}`);
      }
    } else {
      console.warn('Screen Wake Lock API not supported.');
    }
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log('Screen Wake Lock released manually.');
    }
  }

  function handleVisibilityChange() {
    if (wakeLockSentinel !== null && document.visibilityState === 'visible' && !isPaused) {
      requestWakeLock();
    }
  }

  // Reactive:
  $: currentStep = unrolledSteps[currentStepIndex];
  $: nextStep = unrolledSteps[currentStepIndex + 1];
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

    // --- Audio Context ---
    // Use a try-catch block for Safari compatibility
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }


    // Add event listeners for wake lock
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', releaseWakeLock);
  });

  function startTimer() {
    isPaused = false;
    requestWakeLock(); // Request wake lock when timer starts
    if (timerValue <= 0 && currentStep.type === 'time') {
        timerValue = currentStep.amount;
    }

    timerInterval = setInterval(() => {
      timerValue--;
      if (
        currentStep.type === 'time' &&
        timerValue === 5
      ) {
        announceNextExercise();
      }
      if (timerValue <= 0) {
        playBell();
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
        startTimer(); // This sets isPaused = false and requests wake lock
      } else {
        // If the new step is reps-based, we are now "paused" waiting for user input
        isPaused = true;
        timerValue = 0;
        releaseWakeLock(); // Release wake lock if moving to a reps-based step
      }
    } else {
      currentStepIndex++; // This will trigger the `isWorkoutDone` flag
      isPaused = true;
      timerValue = 0; // Ensure timer is 0 when done
      releaseWakeLock(); // Release wake lock when workout is complete
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
      // Create audio context on user interaction
      if (!audioContext) {
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser");
        }
      }
      startTimer();
    } else {
      // Pause
      isPaused = true;
      clearInterval(timerInterval);
      releaseWakeLock(); // Release wake lock when paused
    }
  }

  // Cleanup
  onDestroy(() => {
    clearInterval(timerInterval);
    releaseWakeLock(); // Ensure wake lock is released on component destroy
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', releaseWakeLock);
    if (audioContext) {
      audioContext.close();
    }
  });
</script>

<style>
  .container {
    max-width: 600px;
    margin: 2rem auto 4rem auto; /* Added bottom margin to account for fixed banner */
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

  .next-up-banner {
    position: fixed;
    bottom: 1rem; /* Margin underneath it */
    left: 50%; /* Center the element horizontally */
    transform: translateX(-50%); /* Center the element horizontally */
    max-width: 600px; /* Max width inline with content */
    width: calc(100% - 2rem); /* Take full width minus some side padding/margin on smaller screens, or max-width on larger */
    background-color: #f8f9fa;
    text-align: center;
    padding: 0.75rem 1rem; /* Added horizontal padding for a more distinct UI element */
    border-top: none; /* Remove top border, as it's now floating */
    border-radius: 8px; /* Give it rounded corners like other UI elements */
    box-shadow: 0 2px 10px rgba(0,0,0,0.15); /* More prominent shadow for a "floating" look */
    z-index: 1000;
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

{#if nextStep}
  <div class="next-up-banner">
    Next up: <strong>{nextStep.name}</strong>
  </div>
{/if}
