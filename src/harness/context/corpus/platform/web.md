---
order: 10
---

## The device

The device is a real Chrome browser in a {{viewport}} window, width by height in pixels.
Name a control the way a person reads it: the button label, the field label, the link text.
For goto, the target is the URL. For press, the target is the key.
An action waits for the page to stop changing before it answers, and says how the page moved
meanwhile: layout shifts, and frames that ran long. A shift of 0.1 or more that no input
explains, or a frame over 200 ms, is a jump a person notices even when the text ends up right:
fail the step for it, and say in "got" what moved. Smaller movement goes in "note".
The app under test is {{app}}.
