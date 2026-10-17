# Design tokens

QAzinho has no design system package. The scale is a set of CSS custom properties in
`src/shared/styles/tokens.css`, declared on `[data-theme]`. The layout comes from `assets/prototype.html`;
the colours come from the QAzinho brand: Lima Estagiário `#C6F432` (`--lime`), Tinta `#141414`,
Bug `#FF4D2E` (`--fail`) and Papel `#F4F2EA`.

## Never hardcode what the scale defines

Colour, spacing, radius, font and duration come from a token. A raw value in a stylesheet is a
bug unless it is component geometry (see below).

```css
/* ❌ */
padding: 9px 16px;
border-radius: 9px;
color: #c6f432;
font:
  500 13px/1 'IBM Plex Sans',
  sans-serif;

/* ✅ */
padding: var(--space-3) var(--space-5);
border-radius: var(--radius-md);
color: var(--lime);
font: var(--font-ui-md);
```

## The scales

| Group     | Tokens                                                                         |
| --------- | ------------------------------------------------------------------------------ |
| Surfaces  | `--bg --win --panel --center --raise --raise2 --screen`                        |
| Lines     | `--line --line2 --sel --stripe`                                                |
| Ink       | `--ink --ink2 --ink3`                                                          |
| Accent    | `--lime --lime-ink --lime-soft --on-lime`                                      |
| Verdicts  | `--pass --fail --block --skip --attn`, each with a `-soft` pair                |
| Space     | `--space-1 2px` · `2 4` · `3 8` · `4 12` · `5 16` · `6 20` · `7 24` · `8 30`   |
| Radius    | `--radius-xs 6` · `sm 8` · `md 10` · `lg 12` · `xl 14` · `2xl 16` · `pill 999` |
| Font      | `--font-display --font-ui --font-mono`, plus `--font-ui-sm/md/lg` shorthands   |
| Motion    | `--ease --dur-fast --dur --dur-slow`                                           |
| Elevation | `--shadow --shadow-popover --shadow-modal`                                     |

Both themes declare the same names: `[data-theme='dark']` and `[data-theme='light']`. A token
that exists in one theme and not the other is a bug.

## The three families

`Bricolage Grotesque` for display only (titles, counters, and the wordmark at 800 with tightened tracking, as in the logo), `IBM Plex Sans` for every piece
of body and UI text, `JetBrains Mono` for anything technical: ids, timestamps, paths, counters,
uppercase eyebrows, badges, keycaps and status glyphs.

## When a value is not on the scale

- **Component geometry** — one component's intrinsic dimension (the 268px sidebar, the 46px
  titlebar, the 9/19.5 phone aspect). It goes in that component's `constants/`, named, never
  inlined in the stylesheet.
- **A gap in the scale** — the prototype keeps asking for a step that does not exist. Do not
  snap it silently and do not hardcode it: add the step, and say so.

Snapping a value to the nearest token changes the design. When you do it, say which values moved
and by how much.

## Colour is never the only clue

Every status carries an icon and a word next to the colour. This is in the prototype's own
Appearance copy, and it is a rule, not a preference.
