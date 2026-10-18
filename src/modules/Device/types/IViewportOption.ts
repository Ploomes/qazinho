import type { ViewportId } from './ViewportId';
import type { ParseKeys } from 'i18next';

/** A window size the QA can pick for a web run, and the name it goes by. */
export interface IViewportOption {
  id: ViewportId;
  labelKey: ParseKeys;
  width: number;
  height: number;
}
