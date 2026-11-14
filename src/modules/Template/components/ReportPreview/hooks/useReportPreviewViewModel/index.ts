import type { IReportPreviewProps } from '@/modules/Template/components/ReportPreview/types';

export const useReportPreviewViewModel = (props: IReportPreviewProps) => ({
  label: props.label,
  blocks: props.blocks.map((block, index) => ({
    key: `${block.kind}-${String(index)}`,
    block,
  })),
});
