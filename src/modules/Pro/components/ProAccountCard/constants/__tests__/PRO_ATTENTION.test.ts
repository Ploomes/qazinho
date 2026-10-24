// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import {
  PRO_ATTENTION,
  PRO_DOWNLOAD_FAILURES,
} from '@/modules/Pro/components/ProAccountCard/constants';

describe('PRO_ATTENTION', () => {
  it.each(['en', 'pt'] as const)('says each thing worth knowing in %s', (language) => {
    const t = i18n.getFixedT(language);

    for (const key of Object.values(PRO_ATTENTION)) expect(t(key)).not.toBe(key);
  });
});

describe('PRO_DOWNLOAD_FAILURES', () => {
  it.each(['en', 'pt'] as const)('says why a download did not come in %s', (language) => {
    const t = i18n.getFixedT(language);

    expect(Object.keys(PRO_DOWNLOAD_FAILURES).sort()).toEqual([
      'failed',
      'gone',
      'here',
      'signed-out',
      'unreachable',
    ]);

    for (const key of Object.values(PRO_DOWNLOAD_FAILURES)) expect(t(key)).not.toBe(key);
  });
});
