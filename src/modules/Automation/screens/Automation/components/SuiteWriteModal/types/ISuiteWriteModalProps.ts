import type { ISuiteFolder, ISuitePlanCase } from '@/modules/Automation/types';

/**
 * Asking the agent for a new test: where it goes, the plan cases to start from, and what
 * to do.
 */
export interface ISuiteWriteModalProps {
  folders: ISuiteFolder[];
  cases: ISuitePlanCase[];
  canWrite: boolean;
  note: string;
  onWrite: (ask: { text: string; folder: string; source: ISuitePlanCase | null }) => void;
  onClose: () => void;
}
