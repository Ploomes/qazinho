import type { BugReportBlock } from '@/shared/types';

/** Os blocos que um modelo monta, desenhados como o tracker ou o Confluence os mostra. */
export interface IReportPreviewProps {
  blocks: BugReportBlock[];
  label: string;
}
