# Animation

Motion (`motion/react`) animates the interface. CSS keeps only what never unmounts.

## Which one, and when

| Use Motion for                                    | Keep in CSS                              |
| ------------------------------------------------- | ---------------------------------------- |
| Anything entering or leaving (`AnimatePresence`)  | Ambient loops: a pulsing dot, a shimmer  |
| A list that reorders (`Reorder`, `layout`)        | The comet stroke on a running case       |
| Popovers, modals, the lightbox                    | The recording sweep over the device      |
| Drag: the plan's cases, the device panel's handle | `:hover` and `:active` on a button       |
| A value the view model computes over time         | Anything that would fight the compositor |

A loop that runs forever on a mounted element is cheaper as a keyframe. A transition that has a
beginning and an end belongs to Motion, because React knows when it starts.

## The rules

- **Import `motion` from `motion/react`.** Never from `framer-motion`.
- **Durations and easings come from `MOTION`** in `src/shared/constants/MOTION.ts`, which mirrors the CSS
  tokens. A raw `0.28` in a component is the same bug as a raw `#c6f432`.
- **The view holds the markup, the view model holds the state.** `animate={...}` may read a value
  the view model returned; it may not decide it.
- **Exit needs `AnimatePresence`**, and the element needs a stable `key`.
- **A fold animates `height` on an element with no padding, margin or border**, and
  `overflow: hidden`. Height 0 cannot squeeze padding, so the fold stops short and snaps shut.
  Its spacing goes on an element inside it. In a column with a `gap`, the fold cancels the gap
  with a negative margin of the same token and carries it inside (`.chat__retry`).
- **Respect the system.** Wrap the app in `MotionConfig reducedMotion="user"`, once, in the shell.
  Nothing else checks the media query.
- A component that only fades in on mount does not need Motion. `animation: gc-in` is enough.

## Stickers

A sticker moves like one (`sticker-design.md`): it slaps on, lifts, presses and peels off.

- **Entrances and exits come from `STICKER`** in `src/shared/constants/STICKER.ts`:
  - `slap` for small stickers, `panel` for modals, `pop` for a popover under its anchor,
    `rise` for one above it, `hero` for the Estagiário.
  - `drag` picks a sticker up, and `wobble` marks an event once.
  - Spread the move: `initial={STICKER.panel.initial} animate={STICKER.panel.animate}
exit={STICKER.panel.exit}`.
- **A sticker that only lands on mount** uses a keyframe instead: `gc-slap` for a small one,
  `gc-stick` for a panel. Put it inside `@media (prefers-reduced-motion: no-preference)`, with
  `gc-in` outside it.
- **Hover and press stay in CSS** and move the individual `translate`, `rotate` and `scale`
  properties, never `transform`. Motion owns `transform`, and the individual properties add up
  with it, so a resting tilt or a lift never fights a slap.
- **Evidence never moves like a sticker.** The lightbox and the device enter straight, with no
  turn.
