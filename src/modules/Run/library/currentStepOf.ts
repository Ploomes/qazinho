/** O passo em que a run está: o seguinte aos que já andou, sem passar do último. */
export function currentStepOf(props: { walked: number; total: number }): number {
  return Math.min(props.walked + 1, props.total);
}
