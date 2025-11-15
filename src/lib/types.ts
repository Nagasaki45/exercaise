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
