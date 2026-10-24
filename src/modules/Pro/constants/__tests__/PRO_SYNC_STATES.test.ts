// @vitest-environment jsdom
import type { ProSyncState } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { PRO_SYNC_STATES } from '@/modules/Pro/constants';

const STATES: ProSyncState[] = [
  'off',
  'synced',
  'sending',
  'waiting',
  'conflict',
  'blocked',
  'read-only',
  'signed-out',
  'failed',
];

describe('PRO_SYNC_STATES', () => {
  it('names every state in both languages', () => {
    for (const language of ['en', 'pt'] as const) {
      const t = i18n.getFixedT(language);

      for (const state of STATES)
        expect(t(PRO_SYNC_STATES[state].labelKey)).not.toBe(
          PRO_SYNC_STATES[state].labelKey,
        );
    }
  });

  it('wears a status glyph on what went and on what broke, never colour alone', () => {
    expect(PRO_SYNC_STATES.synced).toMatchObject({ icon: 'passed', tone: 'pass' });
    expect(PRO_SYNC_STATES.failed).toMatchObject({ icon: 'failed', tone: 'fail' });
    expect(PRO_SYNC_STATES.conflict).toMatchObject({ icon: 'attention', tone: 'attn' });
  });
});
