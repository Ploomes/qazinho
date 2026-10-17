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
- **Durations and easings come from `MOTION`** in `src/constants/MOTION.ts`, which mirrors the CSS
  tokens. A raw `0.28` in a component is the same bug as a raw `#c6f432`.
- **The view holds the markup, the view model holds the state.** `animate={...}` may read a value
  the view model returned; it may not decide it.
- **Exit needs `AnimatePresence`**, and the element needs a stable `key`.
- **Respect the system.** Wrap the app in `MotionConfig reducedMotion="user"`, once, in the shell.
  Nothing else checks the media query.
- A component that only fades in on mount does not need Motion. `animation: gc-in` is enough.
