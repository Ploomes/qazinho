import type { IReadyColumn } from '@/modules/Project/types';

/** A coluna do board do Jira em que uma história do projeto chegou para teste. */
export interface IReadyFieldProps {
  column: IReadyColumn | null;
  statuses: string[];
  onChange: (picked: { column: IReadyColumn; statuses: string[] } | null) => void;
}
