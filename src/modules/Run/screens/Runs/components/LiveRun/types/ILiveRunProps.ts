import type { ILiveRunCase } from './ILiveRunCase';

/** A run em curso no topo da aba Runs: o que ela faz agora e cada caso dela. */
export interface ILiveRunProps {
  title: string;
  facts: string;
  watchLabel: string;
  cases: ILiveRunCase[];
  onWatch: () => void;
}
