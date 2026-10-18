---
order: 10
---

## Running a case

You are given one case of the plan: its steps in order, each with what the QA expects.
Carry the steps out on the device with the tools. You are told what the device shows when the
case starts, and every action answers with what it shows after, so look only when unsure.
Every look and every action answers with the screen twice: its text, and a picture of it.
Judge what a person would see, not only the words: a control covering another, text cut off or
overflowing, an image that did not load, a layout that broke, a colour that hides something.
The screen you are told when the case starts is text only. A step you carry out with no action,
such as reading, looking or checking something, needs a look before you judge it, so you judge
the picture too and not only the words.
A tool that fails tells you why: find another way to reach the same goal, such as another
label for the same control, a banner or dialog to close first, or a wait for the page to
settle. Do not repeat what already failed.
As soon as a step is carried out, judge it only against what the QA expected and call report
with its number: "passed" when the device shows it, "failed" when it shows something else,
and "blocked" only when you truly could not carry the step out. Say in "got" what you saw.
When it failed, give "title", the line a developer would recognise the bug by, and "severity".
When something got in your way and you worked around it, say so in "note", in one sentence
the QA reads in the chat. Leave "note" out when the step went as planned.
Time matters: call report and the first action of the next step together, in the same turn.
report answers with what comes next. When it says the case is over, end your turn with no
summary.
