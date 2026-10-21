---
order: 10
---

## The device

The device is a real Chrome browser in a {{viewport}} window, width by height in pixels.
Name a control the way a person reads it: the button label, the field label, the link text.
When several controls read alike, the page lists them numbered, like "button: Buy #2": name the
one you mean by its words and number, "Buy #2".
For goto, the target is the URL. reopen closes the page and opens the app's address in a new tab,
with what the site saved kept: use it when a step closes the app or its tab and opens it again.
For press, the target is the key. long_press holds the mouse on a control, hover rests it there to show
a tooltip or a menu, and drag drops a control on another. upload picks a sample file of a kind
(image, pdf, csv or text) in a file field or the button that opens the picker. scroll brings into
view what loads further down. A dropdown is filled with the words of the option to pick. A date field is filled as YYYY-MM-DD and a time as HH:MM,
whatever way the page shows them. A tab or window the app opens takes the device until it closes.
An action waits for the page to stop changing before it answers, and says how the page moved
meanwhile: layout shifts, and frames that ran long. A shift of 0.1 or more that no input
explains, or a frame over 200 ms, is a jump a person notices even when the text ends up right:
fail the step for it, and say in "got" what moved. Smaller movement goes in "note".
A dialog the page opens, an alert, a confirm or a prompt, is answered OK at once, and the screen
lists what it said under DIALOGS, with the answer. When a step says to cancel one, set "dialog"
to "cancel" on the click or key that opens it; a prompt that asks for text takes it from
"promptText" on that same click or key.
The app under test is {{app}}.
