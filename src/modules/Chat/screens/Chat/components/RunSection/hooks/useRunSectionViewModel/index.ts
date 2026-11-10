import type { IRunSectionProps } from '@/modules/Chat/screens/Chat/components/RunSection/types';
import { MOTION } from '@/shared/constants';

export const useRunSectionViewModel = (props: IRunSectionProps) => {
  const isBodyShown = props.isExpandable && props.isExpanded;
  const when = [props.day, props.at].filter((part) => part !== '').join(' ');

  return {
    hasCaret: props.isExpandable,
    facts: [when, props.facts].filter((part) => part !== '').join(' · '),
    isBodyShown,
    hasOpen: props.openLabel !== null,
    hasActivity: props.isLive && props.activity.length > 0,
    className: props.isLive ? 'run-section run-section--live' : 'run-section',
    bodyTransition: { duration: MOTION.duration, ease: MOTION.ease },
    onToggle: () => {
      if (props.isExpandable) props.onToggle();
    },
  };
};
