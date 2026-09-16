import type { IBugCardProps } from '@/modules/Bug/screens/Bugs/components/BugCard/types';

export const useBugCardViewModel = (props: IBugCardProps) => {
  const { bug, isOpen, onToggle } = props;

  return {
    caret: isOpen ? '▾' : '▸',
    meta: [
      { key: 'run', value: `${bug.runId} · ${bug.runWhen}` },
      { key: 'case', value: `${bug.caseId} · ${bug.step}` },
      { key: 'target', value: bug.target },
      { key: 'build', value: bug.build },
      { key: 'agent', value: 'Claude Code · Sonnet' },
    ],
    onHeadClick: () => {
      onToggle(bug.id);
    },
  };
};
