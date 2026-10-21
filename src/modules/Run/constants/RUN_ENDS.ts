import type { RunEnd } from '@/modules/Run/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';

export const RUN_ENDS = {
  finished: null,
  stopped: { icon: 'stopped', labelKey: 'RUN.ENDED_STOPPED' },
  broke: { icon: 'attention', labelKey: 'RUN.ENDED_BROKE' },
  interrupted: { icon: 'half', labelKey: 'RUN.ENDED_INTERRUPTED' },
} as const satisfies Record<RunEnd, { icon: IconName; labelKey: string } | null>;
