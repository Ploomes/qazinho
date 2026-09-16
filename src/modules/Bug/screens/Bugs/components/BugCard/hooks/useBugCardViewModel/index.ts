import type { IBugCardProps } from '@/modules/Bug/screens/Bugs/components/BugCard/types';
import type { IBugShot } from '@/modules/Bug/types';
import { useModelInUse } from '@/modules/Settings/hooks';
import { useAppStore } from '@/store';

export const useBugCardViewModel = (props: IBugCardProps) => {
  const { bug, isOpen, onToggle } = props;
  const { agent, modelName } = useModelInUse();
  const openMedia = useAppStore((state) => state.openMedia);

  return {
    caret: isOpen ? '▾' : '▸',
    meta: [
      { key: 'run', value: `${bug.runId} · ${bug.runWhen}` },
      { key: 'case', value: `${bug.caseId} · ${bug.step}` },
      { key: 'target', value: bug.target },
      { key: 'seen', value: bug.seen },
      { key: 'agent', value: `${agent} · ${modelName}` },
    ],
    onHeadClick: () => {
      onToggle(bug.id);
    },
    onOpenShot: (shot: IBugShot) => {
      openMedia({
        kicker: `${bug.id} · ${bug.step}`,
        title: shot.label,
        isTall: false,
        src: shot.src,
        file: shot.file,
      });
    },
  };
};
