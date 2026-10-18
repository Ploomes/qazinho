// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { RUN_FAILURE_KEYS } from '@/modules/Run/constants';

describe('RUN_FAILURE_KEYS', () => {
  it.each(['en', 'pt'] as const)('words every reason a run stops, in %s', (language) => {
    const t = i18n.getFixedT(language);
    const said = Object.values(RUN_FAILURE_KEYS).map((key) =>
      t(key, {
        agent: 'Claude Code',
        url: 'http://x.test/',
        code: 'ERR_X',
        said: 'boom',
      }),
    );

    expect(said.every((line) => !line.includes('RUN.') && !line.includes('{{'))).toBe(
      true,
    );
    expect(new Set(said).size).toBe(said.length);
  });
});
