import type { RunAlert } from '@/modules/Settings/types';
import type { ParseKeys } from 'i18next';

export const RUN_ALERTS: { id: RunAlert; labelKey: ParseKeys }[] = [
  { id: 'system', labelKey: 'SETTINGS.RUN_ALERT_SYSTEM' },
  { id: 'app', labelKey: 'SETTINGS.RUN_ALERT_APP' },
];
