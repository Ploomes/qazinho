# Design

QAzinho is a calm, flat place to work all day. **The surface carries the work**: lists, plans,
chat, logs, the device's screen. The brand lives in a few touches, never in every piece: the lime
accent, the Estagiário, the wordmark, Bricolage Grotesque on titles. Nothing is tilted, nothing
wears a thick cut edge, and nothing slaps onto the screen, except the logo.

**The logo stays a sticker**: the Estagiário in the `Logo` atom (`isSticker`: white cut edge,
gloss, his -6° and his shadows) and the `Wordmark`, ink with a paper cut edge
(`--sticker-edge`). Everywhere else he is drawn flat.

It used to be a desk of die-cut stickers: thick paper edges, lifted shadows, tilted badges and
slapped entrances. That was heavy to use for hours, and the QA asked for something lighter
(2026-10-22). The `--sticker-*`, `--edge-*` and `--tilt-*` tokens and `STICKER` keep their names,
and now hold the lighter values.

The designer's art is in `assets/`: `adesivo.js` draws the stickers of the old look, and
`logo/qazinho-lockup.png` is the lockup. Use it for the brand's shapes and colours, not for edges
or tilt.

## Raised or flat

Most things are flat: printed on the surface, separated by space and by a 1px line. A few are
raised a little above it.

| Raised: a 1px line, a soft shadow only when it floats              | Flat: no line of its own, separated by space        |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| popovers, menus, modals, the sign-in popup, the Estagiário's panel | list, table and sidebar rows                        |
| cards: settings, MCP, integration, target, run, handoff            | the chat transcript, logs, YAML, plan step rows     |
| the composer, inputs                                               | labels, eyebrows, the project's name in the sidebar |
| primary buttons, filled in lime with no outline                    | secondary, ghost and icon buttons                   |

**Evidence is never touched.** A screenshot or the live device is not tilted, glossed, outlined or
covered.

## The recipe

Every value comes from a token in `tokens.css` (`design-tokens.md`).

- **Line**: `border: var(--edge-width) solid var(--edge)`, which is 1px of the theme's `--line`.
  The three widths (`--edge-width`, `-lg`, `-xl`) are all 1px; a selected card turns its line
  lime, no thicker.
- **Radius**: `--radius-*` as before; a card is rounded, never sharp.
- **Shadow**: `--sticker-rest` and `--sticker-press` are none, `--sticker-lift` is a hairline
  shadow for a hovered control, and `--sticker-hero` the one soft shadow a popover or modal casts.
- **Tilt**: none. `--tilt-*` are 0deg and stay there; nothing that holds text turns.
- **Type**: titles in Bricolage Grotesque 800 with `--display-tracking`, body in IBM Plex Sans,
  labels, ids and numbers in JetBrains Mono. The wordmark keeps its paper cut edge; a brand
  headline, such as the welcome's, is plain ink.
- **Colour**: lime is the accent, the primary button and the Estagiário. A status wears its colour
  softly (`--fail-soft` behind `--fail` text), never a solid block of it. Indigo appears only in
  brand moments (the onboarding, the welcome board), set with `data-theme="indigo"` on their root.
- **Themes**: Night (dark) and Paper (light). Both declare every token.
- **The Estagiário** is drawn flat and upright: lime, dark eyes, no white edge, no gloss, no
  shadow. He still changes mood. Only the logo draws him as a sticker.

## Motion

Things move through `STICKER` in `src/shared/constants/`, next to `MOTION`. CSS keeps hover and
press, and Motion does every entrance and exit (`animation.md`).

| Move   | What it does                                                      | Where                   |
| ------ | ----------------------------------------------------------------- | ----------------------- |
| slap   | a small thing fades in from barely smaller                        | `STICKER.slap`, `panel` |
| pop    | a popover or menu fades in from 4px off its anchor: `pop`, `rise` | `STICKER.pop`, `rise`   |
| exit   | fades out in under 200ms, quicker than it came                    | every move's `exit`     |
| drag   | a dragged thing grows a little, with no turn                      | `STICKER.drag`          |
| lift   | hover: `translate: 0 var(--lift)` (0 today) and `--sticker-lift`  | CSS, `:hover`           |
| press  | down `var(--press)`, a little smaller                             | CSS, `:active`          |
| wobble | a small pulse for an event that matters, never looped             | `STICKER.wobble`        |

- Nothing rotates as it moves.
- The spring is near critical: no overshoot to speak of.
- Frequent things move less than rare things: a badge that changes every second does not move.
- **Reduced motion**: `MotionConfig` turns every move into a fade, and every CSS lift sits inside
  `@media (prefers-reduced-motion: no-preference)`. The Estagiário holds his still pose.

## Accessibility

- The focus ring is a 2px lime outline, 2px outside the element.
- A control that acts carries a word, not only its shape.
- Contrast is checked on both themes: ink on lime, and a status colour on its soft background.

## Performance

- Box shadows only on what floats. Never `filter: drop-shadow` inside a list.
- Animate `transform` and `opacity`. Never animate `filter`.
- The Estagiário paints on canvas. Under 32px he holds a still pose (`isStill`), and at most two
  moods run on screen at once.
