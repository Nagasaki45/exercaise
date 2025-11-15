<script lang="ts">
  import { workouts } from '$lib/stores';
  import jsyaml from 'js-yaml';
  import type { WorkoutDefinition } from '$lib/types';

  let yamlInput = '';

  function addWorkout() {
    try {
      const data = jsyaml.load(yamlInput) as { workouts: WorkoutDefinition[] };
      if (!data || !data.workouts || !Array.isArray(data.workouts)) {
        alert('Invalid YAML format: Expected an object with a "workouts" array.');
        return;
      }

      workouts.update(currentWorkouts => {
        const newWorkoutsMap = new Map(currentWorkouts.map(w => [w.name, w]));
        
        for (const newWorkout of data.workouts) {
          if (newWorkout.name) {
            newWorkoutsMap.set(newWorkout.name, newWorkout);
          }
        }
        
        return Array.from(newWorkoutsMap.values());
      });

      yamlInput = '';
    } catch (e: any) {
      alert(`Invalid YAML format: ${e.message}`);
    }
  }

  function deleteWorkout(workoutName: string) {
    workouts.update(currentWorkouts => currentWorkouts.filter(w => w.name !== workoutName));
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

  .delete-button {
    background-color: #dc3545;
    margin-left: 1rem;
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
  }

  .delete-button:hover {
    background-color: #c82333;
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

  <h2>My Workouts</h2>
  {#if $workouts.length === 0}
    <p>No workouts saved yet. Add one below!</p>
  {:else}
    <ul class="workout-list">
      {#each $workouts as workout (workout.name)}
        <li>
          <a href="/workout/{encodeURIComponent(workout.name)}">{workout.name}</a>
          <button class="delete-button" on:click={() => deleteWorkout(workout.name)}>Delete</button>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="ai-prompt-section">
    <h2>Need Help with Formatting?</h2>
    <p>
      If you have a workout plan in plain text, you can use our AI prompt to convert it into the required YAML format.
    </p>
    <a href="/prompt" class="button-link">Get AI Prompt</a>
  </div>

  <h2>Add New Workout</h2>
  <textarea bind:value={yamlInput} placeholder="Paste your workout YAML here..."></textarea>
  <button on:click={addWorkout}>Save Workout</button>
</div>