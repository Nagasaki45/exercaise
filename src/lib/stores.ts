// src/lib/stores.ts
import { persisted } from 'svelte-persisted-store';
import type { WorkoutDefinition } from './types';

// This creates a svelte writable store that automatically
// syncs its content to localStorage under the key "user-workouts".
export const workouts = persisted<WorkoutDefinition[]>('user-workouts', []);