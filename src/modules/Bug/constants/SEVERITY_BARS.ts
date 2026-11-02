import type { Severity } from '@/shared/types';

export const SEVERITY_BARS = {
  high: [
    { id: 'one', isOn: true },
    { id: 'two', isOn: true },
    { id: 'three', isOn: true },
  ],
  medium: [
    { id: 'one', isOn: true },
    { id: 'two', isOn: true },
    { id: 'three', isOn: false },
  ],
  low: [
    { id: 'one', isOn: true },
    { id: 'two', isOn: false },
    { id: 'three', isOn: false },
  ],
} as const satisfies Record<Severity, readonly { id: string; isOn: boolean }[]>;
