# gocrash — logo assets

A whole play triangle, fractured by cracks. Nothing is displaced: the triangle
stays level and complete, and the break is carried by one jagged crack with two
short branches. The wordmark keeps a horizontal shear, so the pair reads as the
same fault seen twice — the glass cracked, the word slipped.

The mark is warning amber, not red: red on a triangle reads as a video player.
Amber makes it a caution sign that happens to be a Run button. In the product,
brand amber (hue 82) and the "agent needs you" status (hue 38, warmer/oranger)
are deliberately separated so the two never collide on screen.

**Every asset here includes the soft cast shadow** (down-right, fading along the
bottom-right edge). It is part of the mark, not an effect layered on later.

## Geometry (64-unit grid)

- triangle: `M16 8 L56 32 L16 56 Z`
- main crack: `M13 29.5 L26 32.5 L34 27.5 L44 33 L59 30.5`
- branch up: `M34 27.5 L30.5 17.5` · branch down: `M44 33 L47 44.5`
- shadow: offset +4/+5, gaussian blur 2.4, faded along the bottom-right diagonal

## Optical sizes — three drawings, not one scaled

| size         | crack widths | branches   | shadow          |
| ------------ | ------------ | ---------- | --------------- |
| full, 40px+  | 2.2 / 1.5    | both       | +4/+5, blur 2.4 |
| mid, 20-39px | 2.8 / 2.0    | upper only | +3/+4, blur 1.4 |
| micro, <20px | 4.0          | none       | +3/+3, blur 1.4 |

## Colour

| role                 | hex            | oklch               |
| -------------------- | -------------- | ------------------- |
| brand amber          | #F3A82C        | oklch(0.82 0.16 82) |
| ink on amber         | #3A2708        | oklch(0.24 0.06 82) |
| shadow on dark       | #6B4A12        | oklch(0.36 0.10 82) |
| shadow on amber tile | #8A5F16        | oklch(0.46 0.11 82) |
| light                | #FAFAFA · dark | #16181C             |

## Files

- `gocrash-mark.svg` / `-mid` / `-micro` — the three optical sizes
- `gocrash-mark-white.svg` / `-black.svg` — one-colour, shadow retuned per ground
- `gocrash-icon-tile.svg`, `-16.svg`, `favicon.svg` — app icon, crack shows the tile amber through it
- `gocrash-wordmark-sliced.svg` / `-black.svg` — display wordmark
- `gocrash-wordmark-solid.svg` — UI wordmark, unsliced
- `gocrash-lockup-horizontal.svg`, `gocrash-lockup-stacked.svg`
- `png/` — mark and icon at 16, 32, 48, 64, 128, 256, 512, 1024 px, correct optical size and shadow per size

## Rules

- Sliced for display, solid for UI. A broken name in a title bar reads as a broken app.
- Never slide the halves apart, never the plain triangle, no outline version, no rotation.
- Clear space: 0.35 x the mark height on all sides.

## Type

Space Grotesk 600, lowercase, letter-spacing -0.045em. The wordmark SVGs use live
text — **convert to outlines before handoff**, or the font must be installed
wherever they render.
