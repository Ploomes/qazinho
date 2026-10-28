import type { IRunRowSummary } from '@/modules/Run/screens/Runs/components/RunRow/types';

/** A run em exibição, e as runs para as quais o QA pode trocar, uma página por vez. */
export interface IRunPickerProps {
  current: IRunRowSummary;
  runs: IRunRowSummary[];
  total: number;
  pager: { isShown: boolean; label: string; canGoBack: boolean; canGoOn: boolean };
  factsNote: string;
  onSelect: (runId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}
