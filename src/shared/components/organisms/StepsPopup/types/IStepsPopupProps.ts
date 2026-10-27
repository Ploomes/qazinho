import type { IStepsAction } from './IStepsAction';
import type { IStepsCode } from './IStepsCode';
import type { IStepsDetail } from './IStepsDetail';
import type { IStepsPage } from './IStepsPage';
import type { IStepsRow } from './IStepsRow';
import type { IStepsShownCode } from './IStepsShownCode';
import type { StepsTone } from './StepsTone';
import type { ReactNode } from 'react';

/**
 * A popup of steps taken out of sight; one that ended well closes itself a moment later
 * unless `isKept`, when it still asks something of the QA.
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
