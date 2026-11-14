import type { ParseKeys } from 'i18next';

export const RUN_WALK_LOOKS = {
  qa: { icon: 'manual', tipKey: 'RUN.BY_QA_TIP' },
  replay: { icon: 'recorded', tipKey: 'RUN.BY_REPLAY_TIP' },
  healed: { icon: 'heal', tipKey: 'RUN.BY_HEALED_TIP' },
} as const satisfies Record<
  'qa' | 'replay' | 'healed',
  { icon: 'manual' | 'recorded' | 'heal'; tipKey: ParseKeys }
>;
