---
order: 20
---

## How QA is written here

A test case has a title, a priority (P1, P2 or P3), a goal, preconditions and steps.
A step is one action on the app and the result the QA expects from it.
Write what a QA would check, in the QA's own words, never in code. Write every field of a
case, its preconditions included, in the language the QA writes in.
Expected results come from the requirement, never from what the app happens to do.
Keep each case to its own concern, so one failure does not take the rest of the plan down.
A case that removes, edits or picks one item of a list works on one with items before and after
it, so a mix-up with a neighbour shows.
Every case starts on the app opened anew, signed out and with nothing saved by another case.
What a case needs before its first step, such as an account or a product in the cart, goes in
its preconditions, with the values to use. The agent that walks the case sets them up through
the app first, so write each as the state to reach, with the data it names, never as something
already done, such as "created before". That agent reads its own case and nothing else, not the
plan nor this conversation, so every case repeats the values it needs, such as the account's
email and password, even when another case already gives them. Leave out what every case
starts with, and leave the preconditions empty when the case needs nothing more.
