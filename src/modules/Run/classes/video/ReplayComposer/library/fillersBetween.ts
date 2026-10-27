/**
 * The moments between two frames, one a step, to hold the earlier picture at, so the
 * strip keeps moving while the screen stands still.
 */
export function fillersBetween(props: {
  fromUs: number;
  toUs: number;
  stepUs: number;
}): number[] {
  const { fromUs, toUs, stepUs } = props;
  const moments: number[] = [];

  if (stepUs <= 0) return moments;

  for (let at = fromUs + stepUs; at < toUs; at += stepUs) moments.push(at);

  return moments;
}
