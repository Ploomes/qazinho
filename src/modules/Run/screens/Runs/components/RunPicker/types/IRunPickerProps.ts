import type { IRunRowSummary } from '@/modules/Run/screens/Runs/components/RunRow/types';

/** The run on show, and the runs the QA can switch to, a page at a time. */
export interface IRunPickerProps {
  current: IRunRowSummary;
  runs: IRunRowSummary[];
  pager: { isShown: boolean; label: string; canGoBack: boolean; canGoOn: boolean };
  factsNote: string;
  onSelect: (runId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}
