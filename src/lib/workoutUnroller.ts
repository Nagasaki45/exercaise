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
    for (let roundIndex = 0; roundIndex < workout.rounds.length; roundIndex++) {
      const round = workout.rounds[roundIndex];
      const restAfterRound = parseTime(round.rest_after_round);

      for (let i = 0; i < round.count; i++) {
        // Add all exercises in the round
        for (const ex of round.exercises) {
          addExercise(ex);
        }

        const isLastRoundInDefinition = i === round.count - 1;
        const isLastRoundDefinition = roundIndex === workout.rounds.length - 1;

        // Add rest if it's defined
        if (restAfterRound > 0) {
          // Don't add rest if it's the very last round of the very last round definition
          if (!isLastRoundInDefinition || !isLastRoundDefinition) {
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
  }

  return steps;
}