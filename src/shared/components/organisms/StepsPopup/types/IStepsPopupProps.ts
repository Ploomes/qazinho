import type { IStepsAction } from './IStepsAction';
import type { IStepsCode } from './IStepsCode';
import type { IStepsDetail } from './IStepsDetail';
import type { IStepsPage } from './IStepsPage';
import type { IStepsRow } from './IStepsRow';
import type { IStepsShownCode } from './IStepsShownCode';
import type { StepsTone } from './StepsTone';
import type { ReactNode } from 'react';

/**
 * Um popup de passos dados fora de vista; um que terminou bem se fecha um momento depois,
 * a menos que `isKept`, quando ainda pede algo ao QA.
 */
export interface IStepsPopupProps {
  badge: ReactNode;
  tone: StepsTone;
  title: string;
  subtitle: string;
  rows: IStepsRow[];
  hint: string | null;
  page: IStepsPage | null;
  detail: IStepsDetail | null;
  code: IStepsCode | null;
  shownCode: IStepsShownCode | null;
  actions: IStepsAction[];
  isKept?: boolean;
  onCancel: () => void;
  onClose: () => void;
}
