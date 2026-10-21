import { describe, expect, it } from 'vitest';
import { RUN_ALERTS } from '@/modules/Settings/constants';

describe('RUN_ALERTS', () => {
  it('offers the notification first, the way a run calls the QA back by default', () => {
    expect(RUN_ALERTS.map(({ id }) => id)).toEqual(['system', 'app']);
  });

  it('names each choice in words the QA reads', () => {
    expect(
      RUN_ALERTS.every(({ labelKey }) => labelKey.startsWith('SETTINGS.RUN_ALERT_')),
    ).toBe(true);
  });
});
