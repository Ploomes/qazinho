# Sticker design

QAzinho looks like a desk with stickers on it. **The surface is where the work is printed**:
lists, plans, chat, logs, the device's screen. **The things a QA could pick up are die-cut vinyl
stickers stuck on it**: the Estagiário, the wordmark, the main buttons, badges, cards, popovers,
modals and empty states. A sticker has a cut edge, a shadow that lifts it off the desk, and,
when it is decoration, a tilt. It moves like one: it slaps on, lifts under the cursor, presses
down when clicked, and peels off when it leaves.

The designer's art is the reference, in `assets/`: `adesivo.js` draws the stickers (moods, icon,
wordmark, tag), `humores-png/` and `cartela-adesivos.png` show them, `logo/qazinho-lockup.png` is
the lockup. When in doubt, match them.

## Sticker or printed

The test: could a QA peel it off the screen with a fingernail and stick it somewhere else? Then it
is a sticker. If it is something to read, scan or compare down a column, it is printed.

| Sticker: cut edge, shadow, motion                         | Printed: flat, straight, calm                                |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| the Estagiário, the logo, the wordmark, tags              | list, table and sidebar rows                                 |
| primary buttons                                           | secondary, ghost and icon buttons                            |
| badges: a count, "new"                                    | verdict pills in a list: aligned, colour plus glyph and word |
| cards: settings, MCP, integration, target, count, handoff | plan case bodies, the chat transcript, logs, YAML            |
| popovers, menus, modals, the sign-in popup                | inputs, and the text field inside the composer               |
| empty states, the onboarding, the welcome                 | the device's screen and any evidence                         |

**Evidence is never touched.** A screenshot or the live device is not tilted, glossed, outlined
or covered by a sticker.

## The recipe

Every value comes from a token in `tokens.css` (`design-tokens.md`).

- **Edge**: `border: var(--edge-width) solid var(--edge)`.
  - Width by tier: `--edge-width` (2px) on small stickers, `--edge-width-lg` (3px) on cards,
    `--edge-width-xl` (4px) on modals.
  - On Night the edge is paper, never pure white.
  - On Paper the edge is white, which paper barely shows, so the `--sticker-*` shadows carry a
    hairline around it. Never drop that hairline.
- **Radius**: the outer radius is the inner one plus the edge. A cut never has a sharp corner.
- **Shadow**:
  - Four tiers: `--sticker-rest` at rest, `--sticker-lift` under the cursor, `--sticker-press`
    while pressed, `--sticker-hero` for modals and popups.
  - Each is a hairline, a contact shadow and a soft one. Light comes from above, so shadows fall
    down.
- **Tilt**: decoration only.
  - `--tilt-sm` for tags and badges outside an aligned column.
  - `--tilt-md` for empty-state art.
  - The Estagiário draws his own -6°.
  - Anything holding body text, a number or a column: 0°.
  - A hover may turn a sticker by `--tilt-xs` (1°), never more.
- **Gloss**: only on art. The Estagiário draws his own; UI with text never has one.
- **Type**:
  - A sticker's headline is Bricolage Grotesque 800 with `--display-tracking`.
  - The wordmark is ink with a paper cut edge, drawn by the `Wordmark` atom. A brand headline
    (the welcome's) is drawn the same way.
  - Body text stays IBM Plex Sans, and labels stay JetBrains Mono.
- **Colour**:
  - Lime is the accent, the Estagiário and the primary button.
  - The tag sticker is Tinta with lime mono text, like "BY SALVE SOFTWARE": the `Tag` atom.
  - **Indigo is the brand's table, not a theme**. It appears only in brand moments: the onboarding,
    the welcome board and the app icon. Never in the work area.
  - A brand moment sets `data-theme="indigo"` on its own root. The text on the table then reads in
    paper and lavender, cards on it turn into charcoal stickers with white edges, and the
    Estagiário takes `isOnIndigo` for an indigo shadow.
- **Themes**: Night (Noite, dark) and Paper (Papel, light), the two surfaces of the app icon.
  - Night is a cool charcoal, Paper a warm paper.
  - Both themes declare every sticker token.
- **Budget**: in one view, at most one hero sticker (the Estagiário or the wordmark, large) and a
  handful of tilted small ones. Everything else stands straight.

## Motion

Stickers move through `STICKER` in `src/shared/constants/`, next to `MOTION`. CSS keeps hover and
press, and Motion does every entrance and exit (`animation.md`).

| Move   | What it does                                                          | Where                   |
| ------ | --------------------------------------------------------------------- | ----------------------- |
| slap   | from a larger scale and a turn, onto the desk with a little overshoot | `STICKER.slap`, `panel` |
| pop    | a popover or menu from its anchor: `pop` below it, `rise` above it    | `STICKER.pop`, `rise`   |
| peel   | lifts, turns and drifts up as it fades, in under 200ms                | every move's `exit`     |
| pickup | a dragged sticker grows a little, turns 1.5° and wears its edge       | `STICKER.drag`          |
| lift   | hover: up 2px, a 1° turn, `--sticker-lift`                            | CSS, `:hover`           |
| press  | down 1px, smaller, `--sticker-press`                                  | CSS, `:active`          |
| wobble | once for an event that matters (a verdict, a new bug), never looped   | `STICKER.wobble`        |

- Small stickers slap from scale 1.3 and +8°; panels from 1.06 and -2°, or the movement eats the
  page.
- The spring is stiffness 400, damping 24: about 10% overshoot, settled in about 330ms.
- Frequent things move less than rare things: a badge that changes every second does not slap.
- **Reduced motion**:
  - `MotionConfig` turns slaps and peels into fades.
  - Every CSS lift sits inside `@media (prefers-reduced-motion: no-preference)`.
  - The Estagiário holds his still pose.

## Accessibility

- The focus ring is a 2px lime outline, 2px outside the edge.
- A sticker that acts carries a word, not only its shape.
- Text never turns more than 2°, and a turned sticker never sits in an aligned column.
- Contrast is checked on both themes: ink on lime, paper on Tinta, and Tinta on Bug red, never
  white on it.

## Performance

- Box shadows on boxes. `filter: drop-shadow` only on a few pieces of art, never inside a list or
  anything that scrolls in numbers.
- Animate `transform` and `opacity`. Never animate `filter`, and animate `box-shadow` only on a
  handful of hovered controls.
- The Estagiário paints on canvas, through two layers: his sticker, then its shadows. Under 32px
  he holds a still pose (`isStill`), and at most two moods run on screen at once.
