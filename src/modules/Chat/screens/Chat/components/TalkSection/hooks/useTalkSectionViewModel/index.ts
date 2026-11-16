import type { ITalkSectionProps } from '@/modules/Chat/screens/Chat/components/TalkSection/types';
import { MOTION } from '@/shared/constants';

export const useTalkSectionViewModel = (props: ITalkSectionProps) => ({
  className: props.isLive ? 'talk-section talk-section--live' : 'talk-section',
  isBodyShown: props.isExpanded,
  hasReceipt: props.isExpanded && props.receipt !== null,
  bodyTransition: { duration: MOTION.duration, ease: MOTION.ease },
  onToggle: props.onToggle,
});
