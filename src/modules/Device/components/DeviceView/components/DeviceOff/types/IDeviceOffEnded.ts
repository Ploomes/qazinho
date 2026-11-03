/** O que se faz com a última run quando nada roda: assistir a ela, ou abri-la em Runs. */
export interface IDeviceOffEnded {
  canWatch: boolean;
  watchLabel: string;
  runsLabel: string;
  onWatch: () => void;
  onOpenRuns: () => void;
}
