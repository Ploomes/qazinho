import type { ISuiteFolder, ISuitePlanCase } from '@/modules/Automation/types';

/** Asking the agent for a new test: the suite's folders and the plan cases of the project's workspaces to pick from, whether the agent can take it and why not, and what to do with the ask. */
export interface ISuiteWriteModalProps {
  folders: ISuiteFolder[];
  cases: ISuitePlanCase[];
  canWrite: boolean;
  note: string;
  onWrite: (ask: { text: string; folder: string; source: ISuitePlanCase | null }) => void;
  onClose: () => void;
}
