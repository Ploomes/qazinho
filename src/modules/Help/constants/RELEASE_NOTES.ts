import type { IReleaseNote } from '@/modules/Help/types';

export const RELEASE_NOTES: readonly IReleaseNote[] = [
  {
    version: '0.18.0',
    date: '2026-11-16',
    notes: ['NEWS.V0_18_USAGE', 'NEWS.V0_18_TALK', 'NEWS.V0_18_HELP', 'NEWS.V0_18_LOOK'],
  },
  {
    version: '0.17.0',
    date: '2026-11-15',
    notes: ['NEWS.V0_17_SIGNED_IN', 'NEWS.V0_17_EXPORT'],
  },
  {
    version: '0.16.0',
    date: '2026-11-15',
    notes: ['NEWS.V0_16_DOCK', 'NEWS.V0_16_PHONE'],
  },
  {
    version: '0.15.0',
    date: '2026-11-15',
    notes: ['NEWS.V0_15_STORE'],
  },
  {
    version: '0.14.0',
    date: '2026-11-14',
    notes: [
      'NEWS.V0_14_AHEAD',
      'NEWS.V0_14_CHANGES',
      'NEWS.V0_14_SKILLS',
      'NEWS.V0_14_TEMPLATES',
      'NEWS.V0_14_PROJECT',
    ],
  },
  {
    version: '0.13.0',
    date: '2026-11-12',
    notes: ['NEWS.V0_13_REQUEST', 'NEWS.V0_13_STRIP'],
  },
  {
    version: '0.12.0',
    date: '2026-11-12',
    notes: ['NEWS.V0_12_BUGS', 'NEWS.V0_12_BRAND'],
  },
];
