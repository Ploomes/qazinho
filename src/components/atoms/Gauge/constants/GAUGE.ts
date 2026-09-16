/** The ring's own geometry: a component's intrinsic dimension, not a value on the scale. */
export const GAUGE = {
  size: 16,
  stroke: 2.5,
  radius: 6.75,
  circumference: 2 * Math.PI * 6.75,
  tightUnder: 0.25,
  emptyUnder: 0.1,
} as const;
