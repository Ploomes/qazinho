import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';

export const useChatOnly = () =>
  useSelectedWorkspacePart(({ plan, runs, live }) => ({
    isAlone: plan.length === 0 && runs.length === 0 && live === null,
  }))?.isAlone === true;
