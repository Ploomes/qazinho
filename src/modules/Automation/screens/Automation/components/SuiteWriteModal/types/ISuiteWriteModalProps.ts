import type { ISuiteFolder, ISuitePlanCase } from '@/modules/Automation/types';

/**
 * Pedindo ao agente um teste novo: onde vai, os casos do plano de onde partir, e o que
 * fazer.
 */
export interface ISuiteWriteModalProps {
  folders: ISuiteFolder[];
  cases: ISuitePlanCase[];
  canWrite: boolean;
  note: string;
  onWrite: (ask: { text: string; folder: string; source: ISuitePlanCase | null }) => void;
  onClose: () => void;
}
