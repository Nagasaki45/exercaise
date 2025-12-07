<script lang="ts">
  import { page } from '$app/stores';
  import { workouts } from '$lib/stores';
  import { goto } from '$app/navigation';
  import type { WorkoutDefinition, Round, Exercise } from '$lib/types';

  type DraggableExercise = Exercise & { id: number };
  type DraggableRound = Round & { id: number; exercises: DraggableExercise[] };

  let workout: (WorkoutDefinition & { rounds?: DraggableRound[] }) | undefined;
  let originalName: string = '';
  let idCounter = 0;

  // Find the workout reactively
  $: {
    const slug = $page.params.slug;
    if (slug) {
      const decodedSlug = decodeURIComponent(slug);
      // This condition ensures we only load/clone the workout when the slug changes,
      // or when the component initially mounts and `workout` is undefined.
      if (!workout || originalName !== decodedSlug) {
        const foundWorkout = $workouts.find(w => w.name === decodedSlug);
        if (foundWorkout) {
          const workoutWithIds: any = JSON.parse(JSON.stringify(foundWorkout));
          if (workoutWithIds.rounds) {
            workoutWithIds.rounds.forEach((round: any) => {
              round.id = idCounter++;
              round.exercises.forEach((ex: any) => {
                ex.id = idCounter++;
              });
            });
          }
          workout = workoutWithIds;
          originalName = workout.name;
        } else {
          goto('/');
        }
      }
    } else {
      goto('/');
    }
  }

  function saveWorkout() {
    if (!workout) return;

    // Create a deep copy to strip IDs before saving, so we don't mutate component state
    const workoutToSave: WorkoutDefinition = JSON.parse(JSON.stringify(workout));
    if (workoutToSave.rounds) {
      workoutToSave.rounds.forEach((round: any) => {
        delete round.id;
        round.exercises.forEach((ex: any) => delete ex.id);
      });
    }

    // Type coercion for exercises inside rounds, ensure numbers are numbers
    if (workoutToSave.rounds) {
      workoutToSave.rounds.forEach(round => {
        round.count = Number(round.count) || 1;
        round.exercises.forEach(ex => {
          ex.amount = Number(ex.amount) || 0;
          ex.sets = Number(ex.sets) || 1;
        });
      });
    }

    workouts.update(currentWorkouts => {
      const workoutMap = new Map(currentWorkouts.map(w => [w.name, w]));
      if (originalName && originalName !== workoutToSave.name) {
        workoutMap.delete(originalName);
      }
      workoutMap.set(workoutToSave.name, workoutToSave);
      return Array.from(workoutMap.values());
    });

    if (originalName !== workout.name) {
      const newSlug = encodeURIComponent(workout.name);
      // Use replaceState to avoid adding to browser history and triggering a reload
      history.replaceState({}, '', `/workout/${newSlug}`);
      originalName = workout.name;
    }
  }

  function addRound() {
    if (!workout) return;
    if (!workout.rounds) {
      workout.rounds = [];
    }
    workout.rounds.push({
      id: idCounter++,
      count: 1,
      exercises: []
    });
    workout = workout; // Trigger reactivity
    saveWorkout();
  }

  function deleteRound(roundIndex: number) {
    if (!workout || !workout.rounds) return;
    if (confirm('Are you sure you want to delete this round?')) {
      workout.rounds.splice(roundIndex, 1);
      workout = workout; // Trigger reactivity
      saveWorkout();
    }
  }

  function addExercise(roundIndex: number) {
    if (!workout || !workout.rounds) return;
    workout.rounds[roundIndex].exercises.push({
      id: idCounter++,
      name: 'New Exercise',
      type: 'reps',
      amount: 10,
      sets: 1,
      rest: '30s'
    });
    workout = workout; // Trigger reactivity
    saveWorkout();
  }

  function deleteExercise(roundIndex: number, exerciseIndex: number) {
    if (!workout || !workout.rounds) return;
    if (confirm('Are you sure you want to delete this exercise?')) {
      workout.rounds[roundIndex].exercises.splice(exerciseIndex, 1);
      workout = workout; // Trigger reactivity
      saveWorkout();
    }
  }

  function deleteWorkout() {
    if (workout) {
      if (confirm(`Are you sure you want to delete "${workout.name}"?`)) {
        workouts.update(currentWorkouts => currentWorkouts.filter(w => w.name !== originalName));
        goto('/');
      }
    }
  }

  function moveRound(index: number, direction: 'up' | 'down') {
    if (!workout || !workout.rounds) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workout.rounds.length) return;

    const [movedRound] = workout.rounds.splice(index, 1);
    workout.rounds.splice(newIndex, 0, movedRound);

    workout.rounds = workout.rounds; // Trigger reactivity
    saveWorkout();
  }

  function moveExercise(roundIndex: number, exerciseIndex: number, direction: 'up' | 'down') {
    if (!workout || !workout.rounds) return;
    const exercises = workout.rounds[roundIndex].exercises;
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const [movedExercise] = exercises.splice(exerciseIndex, 1);
    exercises.splice(newIndex, 0, movedExercise);

    workout.rounds[roundIndex].exercises = exercises; // Trigger reactivity
    workout = workout; // Trigger reactivity for parent
    saveWorkout();
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
  .button-edit {
    background-color: #ffc107;
    color: #212529;
  }
  .button-edit:hover {
    background-color: #e0a800;
  }
  .exercise-list.standalone li {
    background-color: #f9f9f9;
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
    display: flex;
    align-items: center;
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

  /* Editable Fields */
  input,
  select,
  textarea {
    font-size: 1rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 0.5rem;
  }

  .workout-name-input {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    margin-bottom: 2rem;
  }
  .workout-name-input:focus {
    border-bottom: 2px solid #007bff;
    outline: none;
  }

  .round-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .round-header h3 {
    margin: 0;
  }
  .round-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }
  .round-controls input {
    width: 80px;
    text-align: center;
    margin-bottom: 0;
  }
  .round-controls label {
    font-size: 0.9rem;
    color: #555;
    white-space: nowrap;
  }

  .button-delete-small {
    background-color: transparent;
    border: none;
    color: #dc3545;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 0 0.5rem;
    line-height: 1;
  }
  .button-delete-small:hover {
    color: #a71d2a;
  }

  .exercise-item {
    display: grid;
    grid-template-columns: auto 1fr auto; /* handle, form, delete */
    gap: 1rem;
    align-items: start;
    padding: 1rem;
    background-color: #fff;
    border: 1px solid #eee;
    margin-bottom: 0.75rem;
    border-radius: 4px;
  }

  .move-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.25rem;
  }
  .move-button {
    background: transparent;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
    color: #555;
  }
  .move-button:hover:not(:disabled) {
    background-color: #f0f0f0;
    border-color: #aaa;
  }
  .move-button:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  .exercise-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
    align-items: center;
  }

  .exercise-form-notes {
    grid-column: 1 / -1;
  }

  .exercise-form label {
    display: block;
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .exercise-form input, .exercise-form select, .exercise-form textarea {
      margin-bottom: 0;
  }

  .button-add {
    background-color: #007bff;
    color: white;
    border: 1px solid #007bff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 1rem;
    display: block;
    width: 100%;
  }
  .button-add:hover {
    background-color: #0056b3;
  }
</style>

<div class="container">
  {#if workout}
    <input class="workout-name-input" bind:value={workout.name} on:blur={saveWorkout} />

    <div class="actions">
      <a href="/workout/{encodeURIComponent(workout.name)}/run" class="button button-start">Start Workout</a>
      <a href="/workout/{encodeURIComponent(originalName)}/edit" class="button button-edit">Edit YAML</a>
      <button on:click={deleteWorkout} class="button button-delete">Delete Workout</button>
    </div>

    <h2>Workout Structure</h2>

    {#if workout.rounds}
      <div class="rounds-container">
        {#each workout.rounds as round, roundIndex (round.id)}
          <div class="round-card">
            <div class="round-header">
              <div class="move-buttons">
                <button
                  class="move-button"
                  on:click={() => moveRound(roundIndex, 'up')}
                  disabled={roundIndex === 0}>&uarr;</button
                >
                <button
                  class="move-button"
                  on:click={() => moveRound(roundIndex, 'down')}
                  disabled={roundIndex === workout.rounds.length - 1}>&darr;</button
                >
              </div>
              <h3>Round {roundIndex + 1}</h3>
              <div class="round-controls">
                <label for="round-count-{roundIndex}">Count:</label>
                <input
                  id="round-count-{roundIndex}"
                  type="number"
                  bind:value={round.count}
                  on:blur={saveWorkout}
                  min="1"
                />
                <label for="round-rest-{roundIndex}">Rest After:</label>
                <input
                  id="round-rest-{roundIndex}"
                  type="text"
                  bind:value={round.rest_after_round}
                  on:blur={saveWorkout}
                  placeholder="e.g. 60"
                />
              </div>
              <button class="button-delete-small" on:click={() => deleteRound(roundIndex)} title="Delete Round"
                >&times;</button
              >
            </div>

            <div class="exercise-list">
              {#each round.exercises as exercise, exerciseIndex (exercise.id)}
                <div class="exercise-item">
                  <div class="move-buttons">
                    <button
                      class="move-button"
                      on:click={() => moveExercise(roundIndex, exerciseIndex, 'up')}
                      disabled={exerciseIndex === 0}>&uarr;</button
                    >
                    <button
                      class="move-button"
                      on:click={() => moveExercise(roundIndex, exerciseIndex, 'down')}
                      disabled={exerciseIndex === round.exercises.length - 1}>&darr;</button
                    >
                  </div>
                  <div class="exercise-form">
                    <div>
                      <label for="ex-name-{roundIndex}-{exerciseIndex}">Name</label>
                      <input
                        id="ex-name-{roundIndex}-{exerciseIndex}"
                        bind:value={exercise.name}
                        on:blur={saveWorkout}
                      />
                    </div>
                    <div>
                      <label for="ex-type-{roundIndex}-{exerciseIndex}">Type</label>
                      <select
                        id="ex-type-{roundIndex}-{exerciseIndex}"
                        bind:value={exercise.type}
                        on:change={saveWorkout}
                      >
                        <option value="reps">Reps</option>
                        <option value="time">Time</option>
                      </select>
                    </div>
                    <div>
                      <label for="ex-amount-{roundIndex}-{exerciseIndex}">Amount</label>
                      <input
                        id="ex-amount-{roundIndex}-{exerciseIndex}"
                        type="text"
                        bind:value={exercise.amount}
                        on:blur={saveWorkout}
                      />
                    </div>
                    <div>
                      <label for="ex-sets-{roundIndex}-{exerciseIndex}">Sets</label>
                      <input
                        id="ex-sets-{roundIndex}-{exerciseIndex}"
                        type="number"
                        bind:value={exercise.sets}
                        on:blur={saveWorkout}
                        min="1"
                      />
                    </div>
                    <div>
                      <label for="ex-rest-{roundIndex}-{exerciseIndex}">Rest</label>
                      <input
                        id="ex-rest-{roundIndex}-{exerciseIndex}"
                        type="text"
                        bind:value={exercise.rest}
                        on:blur={saveWorkout}
                        placeholder="e.g. 45"
                      />
                    </div>
                    <div class="exercise-form-notes">
                      <label for="ex-notes-{roundIndex}-{exerciseIndex}">Notes</label>
                      <textarea
                        id="ex-notes-{roundIndex}-{exerciseIndex}"
                        bind:value={exercise.notes}
                        on:blur={saveWorkout}
                        rows="2"
                      ></textarea>
                    </div>
                  </div>
                  <button
                    class="button-delete-small"
                    on:click={() => deleteExercise(roundIndex, exerciseIndex)}
                    title="Delete Exercise">&times;</button
                  >
                </div>
              {/each}
            </div>
            <button class="button-add" on:click={() => addExercise(roundIndex)}>+ Add Exercise</button>
          </div>
        {/each}
      </div>
      <button class="button-add" on:click={addRound}>+ Add Round</button>
    {:else if workout.exercises}
      <p>Inline editing for this workout format is not yet available.</p>
      <ul class="exercise-list standalone">
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
    <p>Workout not found. Loading...</p>
  {/if}
</div>
