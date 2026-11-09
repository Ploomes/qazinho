import type { BugCategory } from './BugCategory';
import type { IDesignShot } from './IDesignShot';
import type { IScreenBox } from './IScreenBox';
import type { Severity } from './Severity';

/**
 * Um bug que o runner registrou ao lado de um passo, com a tela e quando; `sameAs` nomeia
 * um bug aberto visto de novo.
 */
export interface IRunFinding {
  caseId: string;
  stepNumber: number;
  index: number;
  action: string;
  title: string;
  severity: Severity;
  at: number;
  expected: string;
  got: string;
  screenshot: string | null;
  shotFile: string | null;
  sameAs?: string;
  frame?: string;
  designShot?: IDesignShot;
  category?: BugCategory;
  box?: IScreenBox;
}
