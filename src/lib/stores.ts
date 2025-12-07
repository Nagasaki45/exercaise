// src/lib/stores.ts
import { persisted } from 'svelte-persisted-store';
import type { WorkoutDefinition } from './types';

// This creates a svelte writable store that automatically
// syncs its content to localStorage under the key "user-workouts".
export const workouts = persisted<WorkoutDefinition[]>('user-workouts', [
  {
    name: 'My First Workout',
    rounds: [
      {
        count: 3,
        rest_after_round: 60,
        exercises: [
          {
            name: 'Push-ups',
            type: 'reps',
            amount: 10,
            sets: 3,
            rest: 45,
            notes: 'Keep form strict.'
          },
          {
            name: 'Jumping Jacks',
            type: 'time',
            amount: 60,
            sets: 1
          }
        ]
      }
    ]
  }
]);
