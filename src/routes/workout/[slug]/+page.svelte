<script lang="ts">
  import { page } from '$app/stores';
  import { workouts } from '$lib/stores';
  import { goto } from '$app/navigation';
  import type { WorkoutDefinition } from '$lib/types';
  import { onMount } from 'svelte';

  let workout: WorkoutDefinition | undefined;
  let workoutName: string = '';

  onMount(() => {
    const slug = $page.params.slug;
    if (slug) {
      workoutName = decodeURIComponent(slug);
      workout = $workouts.find(w => w.name === workoutName);
      if (!workout) {
        goto('/');
      }
    } else {
      goto('/');
    }
  });

  function deleteWorkout() {
    if (workout) {
      workouts.update(currentWorkouts => currentWorkouts.filter(w => w.name !== workout?.name));
      goto('/');
    }
  }
</script>

<style>
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
    font-family: sans-serif;
  }
  h1 {
    color: #333;
    margin-bottom: 2rem;
    text-align: center;
  }
  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .button {
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    text-decoration: none;
    display: inline-block;
  }
  .button-start {
    background-color: #28a745;
  }
  .button-start:hover {
    background-color: #218838;
  }
  .button-delete {
    background-color: #dc3545;
  }
  .button-delete:hover {
    background-color: #c82333;
  }
  h2 {
    margin-top: 3rem;
    margin-bottom: 1rem;
    color: #333;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  .round-card {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .round-card h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #0056b3;
  }
  .round-meta {
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
  }
  .exercise-list {
    list-style: none;
    padding: 0;
  }
  .exercise-list li {
    background-color: #fff;
    border: 1px solid #eee;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border-radius: 4px;
  }
  .exercise-name {
    font-weight: bold;
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
  }
  .exercise-details {
    color: #555;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  .exercise-notes {
    color: #666;
    font-size: 0.85rem;
    font-style: italic;
    background-color: #f0f0f0;
    padding: 0.5rem;
    border-radius: 4px;
  }
</style>

<div class="container">
  {#if workout}
    <h1>{workout.name}</h1>

    <div class="actions">
      <a href="/workout/{encodeURIComponent(workoutName)}/run" class="button button-start">Start Workout</a>
      <button on:click={deleteWorkout} class="button button-delete">Delete Workout</button>
    </div>

    <h2>Workout Structure</h2>

    {#if workout.rounds}
      <div class="rounds-container">
        {#each workout.rounds as round, roundIndex}
          <div class="round-card">
            <h3>Round {roundIndex + 1} ({round.count}x)</h3>
            {#if round.rest_after_round}
              <p class="round-meta">
                Rest after round: {round.rest_after_round}{typeof round.rest_after_round ===
                'number'
                  ? 's'
                  : ''}
              </p>
            {/if}
            <ul class="exercise-list">
              {#each round.exercises as exercise}
                <li>
                  <div class="exercise-name">{exercise.name}</div>
                  <div class="exercise-details">
                    {exercise.amount}{exercise.type === 'reps'
                      ? ' reps'
                      : typeof exercise.amount === 'number'
                      ? 's'
                      : ''}
                    {#if exercise.sets && exercise.sets > 1}
                      <span>&nbsp;&bull;&nbsp;{exercise.sets} sets</span>
                    {/if}
                    {#if exercise.rest}
                      <span
                        >&nbsp;&bull;&nbsp;{exercise.rest}{typeof exercise.rest === 'number'
                          ? 's'
                          : ''} rest</span
                      >
                    {/if}
                  </div>
                  {#if exercise.notes}
                    <div class="exercise-notes">{exercise.notes}</div>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {:else if workout.exercises}
      <ul class="exercise-list">
        {#each workout.exercises as exercise}
          <li>
            <div class="exercise-name">{exercise.name}</div>
            <div class="exercise-details">
              {exercise.amount}{exercise.type === 'reps'
                ? ' reps'
                : typeof exercise.amount === 'number'
                ? 's'
                : ''}
              {#if exercise.sets && exercise.sets > 1}
                <span>&nbsp;&bull;&nbsp;{exercise.sets} sets</span>
              {/if}
              {#if exercise.rest}
                <span
                  >&nbsp;&bull;&nbsp;{exercise.rest}{typeof exercise.rest === 'number' ? 's' : ''}
                  rest</span
                >
              {/if}
            </div>
            {#if exercise.notes}
              <div class="exercise-notes">{exercise.notes}</div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    <p>Workout not found. Redirecting...</p>
  {/if}
</div>
