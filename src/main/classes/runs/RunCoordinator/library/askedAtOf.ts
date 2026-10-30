/**
 * Onde a run estava quando perguntou ao QA: o passo do caso, ou a tela que o explorador
 * disse estar quando a última que anotou já ficou para trás.
 */
export function askedAtOf(props: {
  at: { caseId: string; stepNumber: number; action: string };
  screen: string | null;
  isExploring: boolean;
}): { caseId: string; stepNumber: number; action: string } {
  const { at, screen, isExploring } = props;

  return isExploring && screen !== null ? { ...at, action: screen } : at;
}
