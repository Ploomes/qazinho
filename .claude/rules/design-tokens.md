# Design tokens

QAzinho has no design system package. The scale is a set of CSS custom properties in
`src/shared/styles/tokens.css`, declared on `[data-theme]`. The layout comes from `assets/prototype.html`;
the colours come from the QAzinho brand: Lima Estagiário `#C6F432` (`--lime`), Tinta `#141414`
(`--brand-ink`), Bug `#FF4D2E` (`--fail`), Papel `#F4F2EA` (`--brand-paper`) and the indigo of
the sticker sheet (`--indigo`). How they become stickers is `sticker-design.md`.

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

| Group     | Tokens                                                                              |
| --------- | ----------------------------------------------------------------------------------- |
| Surfaces  | `--bg --win --panel --center --raise --raise2 --screen`                             |
| Lines     | `--line --line2 --sel --stripe`                                                     |
| Ink       | `--ink --ink2 --ink3`                                                               |
| Accent    | `--lime --lime-ink --lime-soft --on-lime`                                           |
| Verdicts  | `--pass --fail --block --skip --attn`, each with a `-soft` pair                     |
| Space     | `--space-1 2px` · `2 4` · `3 8` · `4 12` · `5 16` · `6 20` · `7 24` · `8 30`        |
| Icon      | `--icon-min` 12px, the smallest an icon sized by its text draws                     |
| Radius    | `--radius-xs 6` · `sm 8` · `md 12` · `lg 14` · `xl 18` · `2xl 22` · `pill 999`      |
| Font      | `--font-display --font-ui --font-mono`, `--font-ui-*`, `--font-display-sm/md/lg/xl` |
| Type      | `--display-tracking` for display at 800, `--font-mono-tag --tag-tracking` for tags  |
| Motion    | `--ease --ease-in --dur-press --dur-fast --dur --dur-slow`                          |
| Sticker   | `--edge`, `--edge-width` 2 · `-lg` 3 · `-xl` 4, and the shadows below               |
| Elevation | `--sticker-rest --sticker-lift --sticker-press --sticker-hero`                      |
| Tilt      | `--tilt-xs` -1° · `--tilt-sm` -2° · `--tilt-md` -4°                                 |
| Brand     | `--brand-ink --brand-paper --indigo --indigo-deep --indigo-dusk --on-indigo`        |

A mono field, the URL input or a file field beside it, reads `--font-mono-field`, so two fields
in a row stand as tall as each other.

Both themes declare the same names: `[data-theme='dark']` is Night and `[data-theme='light']`
is Paper, the two surfaces of the app icon.

`[data-theme='indigo']` is not a theme the QA picks. A brand moment (the onboarding, the welcome
board) sets it on its own root, so the text on the indigo table reads and the cards on it turn
into charcoal stickers. It declares the same names too. A token that exists in one scope and not
the others is a bug.

## The three families

`Bricolage Grotesque` for display only: titles and counters at 800 with `--display-tracking`,
like the wordmark. `IBM Plex Sans` for every piece of body and UI text. `JetBrains Mono` for
anything technical: ids, timestamps, paths, counters, uppercase eyebrows, tags, badges, keycaps
and status glyphs.

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
