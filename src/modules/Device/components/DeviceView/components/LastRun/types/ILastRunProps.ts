import type { ILastRunCase } from './ILastRunCase';
import type { LastRunSayKey } from '@/modules/Device/types';

/** A última run sob a tela dela: de quando é a tela, como a run foi e o que falhou. */
export interface ILastRunProps {
  caption: string;
  sayKey: LastRunSayKey;
  sayValues: { when: string; failed: string; passed: string; time: string };
  runsLabel: string;
  canWatch: boolean;
  watchLabel: string;
  cases: ILastRunCase[];
  onOpenRuns: () => void;
  onWatch: () => void;
}
