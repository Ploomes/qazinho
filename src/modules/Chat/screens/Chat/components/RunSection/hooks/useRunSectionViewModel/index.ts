import type { IRunSectionProps } from '@/modules/Chat/screens/Chat/components/RunSection/types';
import { MOTION } from '@/shared/constants';

export const useRunSectionViewModel = (props: IRunSectionProps) => {
  const isBodyShown = props.isExpandable && props.isExpanded;

  return {
    hasCaret: props.isExpandable,
    facts: props.facts,
    isBodyShown,
    hasOpen: props.openLabel !== null,
    className: props.isLive ? 'run-section run-section--live' : 'run-section',
    bodyTransition: { duration: MOTION.duration, ease: MOTION.ease },
    onToggle: () => {
      if (props.isExpandable) props.onToggle();
    },
  };
};
