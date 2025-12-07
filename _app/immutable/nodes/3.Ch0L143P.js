import{f,a as h}from"../chunks/DJS9wBG_.js";import{i as d}from"../chunks/CWFtMCaS.js";import{S as b,U as r,Y as v,T as y,V as n,X as a,d as w,q as x,R as i}from"../chunks/D3NXlZUO.js";import{e as k,s as A}from"../chunks/tj3d_5tf.js";var T=f('<div class="container svelte-baauen"><h1 class="svelte-baauen">AI Prompt for Workout Plan Conversion</h1> <p class="svelte-baauen">Use the following prompt to ask an AI to convert your free-text workout plan into the YAML format our app requires. Simply copy the prompt, paste it into your conversation with the AI, and replace the placeholder text with your own plan.</p> <pre class="svelte-baauen"></pre> <button class="svelte-baauen"> </button></div>');function g(p,u){b(u,!1);let l=`Please convert this workout plan into the specific YAML format required by my workout app.

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

Please ensure the output is only the YAML code block, as I will be pasting it directly into the app.`,e=x("Copy to Clipboard");function c(){navigator.clipboard.writeText(l).then(()=>{i(e,"Copied!"),setTimeout(()=>{i(e,"Copy to Clipboard")},2e3)},()=>{alert("Failed to copy prompt to clipboard.")})}d();var t=T(),s=r(n(t),4);s.textContent=`Please convert this workout plan into the specific YAML format required by my workout app.

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

Please ensure the output is only the YAML code block, as I will be pasting it directly into the app.`;var o=r(s,2),m=n(o,!0);a(o),a(t),v(()=>A(m,w(e))),k("click",o,c),h(p,t),y()}export{g as component};
