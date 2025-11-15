<script lang="ts">
  let promptText = `Please convert this workout plan into the specific YAML format required by my workout app.

The YAML format should follow this structure:

workouts:
  - name: <Name of the Workout>
    rounds:
      - count: <Number of Rounds>
        rest_after_round: <Rest time in seconds>
        exercises:
          - name: <Exercise Name>
            type: <'time' or 'reps'>
            amount: <Time in seconds or number of reps>
            sets: <Number of sets for this exercise>
            rest: <Rest time in seconds between sets>
            notes: <Optional notes for the exercise>

Please ensure the output is only the YAML code block, as I will be pasting it directly into the app.`;

  let buttonText = 'Copy to Clipboard';

  function copyToClipboard() {
    navigator.clipboard.writeText(promptText).then(() => {
      buttonText = 'Copied!';
      setTimeout(() => {
        buttonText = 'Copy to Clipboard';
      }, 2000);
    }, () => {
      alert('Failed to copy prompt to clipboard.');
    });
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
    margin-bottom: 1rem;
  }

  p {
    color: #555;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  pre {
    background-color: #f4f4f4;
    padding: 1rem;
    border-radius: 8px;
    white-space: pre-wrap; /* Allows text to wrap */
    word-wrap: break-word; /* Breaks long words */
    font-family: monospace;
    font-size: 0.95rem;
    border: 1px solid #ddd;
  }

  button {
    background-color: #28a745;
    color: white;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: #218838;
  }
</style>

<div class="container">
  <h1>AI Prompt for Workout Plan Conversion</h1>
  <p>
    Use the following prompt to ask an AI to convert your free-text workout plan into the YAML format our app requires. Simply copy the prompt, paste it into your conversation with the AI, and replace the placeholder text with your own plan.
  </p>

  <pre>{promptText}</pre>

  <button on:click={copyToClipboard}>{buttonText}</button>
</div>
