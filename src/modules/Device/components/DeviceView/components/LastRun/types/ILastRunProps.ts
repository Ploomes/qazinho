import type { ILastRunCase } from './ILastRunCase';

/** A última run sob a tela dela: de quando é a tela, como a run foi e o que falhou. */
export interface ILastRunProps {
  caption: string;
  sayKey: string;
  sayValues: { when: string; failed: string; passed: string; time: string };
  runsLabel: string;
  canWatch: boolean;
  watchLabel: string;
  cases: ILastRunCase[];
  onOpenRuns: () => void;
  onWatch: () => void;
}
