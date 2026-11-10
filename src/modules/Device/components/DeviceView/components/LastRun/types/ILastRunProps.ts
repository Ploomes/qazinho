import type { ILastRunCase } from './ILastRunCase';

/** A última run sob a tela dela: quando foi, como foi e o que falhou. */
export interface ILastRunProps {
  title: string;
  facts: string;
  failedLabel: string;
  passedLabel: string;
  where: string;
  runsLabel: string;
  canWatch: boolean;
  watchLabel: string;
  cases: ILastRunCase[];
  onOpenRuns: () => void;
  onWatch: () => void;
}
