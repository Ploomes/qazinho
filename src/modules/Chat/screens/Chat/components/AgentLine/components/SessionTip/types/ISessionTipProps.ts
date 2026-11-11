import type { ISessionTipRow } from './ISessionTipRow';

export interface ISessionTipProps {
  title: string;
  rows: ISessionTipRow[];
  note: string;
}
