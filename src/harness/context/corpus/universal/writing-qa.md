---
order: 20
---

## How QA is written here

A test case has a title, a priority (P1, P2 or P3), a goal, preconditions and steps.
A step is one action on the app and the result the QA expects from it.
Write what a QA would check, in the QA's own words, never in code.
Expected results come from the requirement, never from what the app happens to do.
Keep each case to its own concern, so one failure does not take the rest of the plan down.
Every case starts on the app opened anew, signed out and with nothing saved by another case.
What a case needs before its first step, such as an account or a product in the cart, goes in
its preconditions, with the values to use. The agent that walks the case sets them up through
the app first, so write each as the state to reach, such as "An appointment for Ana Souza,
Haircut, 10:00 to 10:30", never as something already done, such as "created before". Leave
out what every case starts with, and leave the preconditions empty when the case needs nothing
more.
