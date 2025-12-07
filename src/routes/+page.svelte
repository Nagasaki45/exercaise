<script lang="ts">
  import { workouts } from '$lib/stores';
  import { goto } from '$app/navigation';
  import type { WorkoutDefinition } from '$lib/types';

  function createNewWorkout() {
    let newWorkoutName = 'New Workout';
    let counter = 1;
    const existingNames = new Set($workouts.map(w => w.name));

    while (existingNames.has(newWorkoutName)) {
      counter++;
      newWorkoutName = `New Workout ${counter}`;
    }

    const newWorkout: WorkoutDefinition = {
      name: newWorkoutName,
      rounds: [
        {
          count: 1,
          exercises: [{}],
        }
      ]
    };

    workouts.update(currentWorkouts => {
      return [...currentWorkouts, newWorkout];
    });

    goto(`/workout/${encodeURIComponent(newWorkoutName)}`);
  }
</script>

<style>
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
    font-family: sans-serif;
  }

  h1, h2 {
    color: #333;
    margin-bottom: 1rem;
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .split-button {
    display: flex;
  }
  .split-button > button {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .split-button-action {
    background-color: #007bff;
    color: white;
    padding: 0.75rem 1.25rem;
    border: none;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    text-decoration: none;
    display: flex;
    align-items: center;
    border-left: 1px solid rgba(255, 255, 255, 0.25);
  }
  .split-button-action:hover {
    background-color: #0056b3;
  }

  .header-actions h2 {
    margin-bottom: 0;
  }

  textarea {
    width: 100%;
    height: 150px;
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; /* Include padding in width */
  }

  button {
    background-color: #007bff;
    color: white;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background-color: #0056b3;
  }

  .workout-list {
    list-style: none;
    padding: 0;
  }

  .workout-list li {
    background-color: #f8f8f8;
    border: 1px solid #eee;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .workout-list li a {
    text-decoration: none;
    color: #007bff;
    font-weight: bold;
    flex-grow: 1;
  }

  .workout-list li a:hover {
    text-decoration: underline;
  }


  .ai-prompt-section {
    background-color: #e9f5ff;
    border: 1px solid #b3d7ff;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
    text-align: center;
  }

  .button-link {
    display: inline-block;
    background-color: #28a745;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .button-link:hover {
    background-color: #218838;
  }
</style>

<div class="container">
  <h1>Workout App</h1>

  <div class="header-actions">
    <h2>My Workouts</h2>
    <div class="split-button">
      <button on:click={createNewWorkout}>+ New Workout</button>
      <a href="/edit-raw" class="split-button-action" title="Edit all workouts as raw YAML">Edit</a>
    </div>
  </div>
  {#if $workouts.length === 0}
    <p>No workouts saved yet. Add one below!</p>
  {:else}
    <ul class="workout-list">
      {#each $workouts as workout (workout.name)}
        <li>
          <a href="/workout/{encodeURIComponent(workout.name)}">{workout.name}</a>
        </li>
      {/each}
    </ul>
  {/if}

</div>
