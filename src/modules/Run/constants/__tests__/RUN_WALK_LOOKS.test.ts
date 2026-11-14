// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { RUN_WALK_LOOKS } from '@/modules/Run/constants';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

describe('RUN_WALK_LOOKS', () => {
  it.each(['en', 'pt'] as const)(
    'words every way a case was walked apart, in %s',
    (language) => {
      const t = i18n.getFixedT(language);
      const said = Object.values(RUN_WALK_LOOKS).map(({ tipKey }) => t(tipKey));

      expect(said.every((line) => !line.includes('RUN.'))).toBe(true);
      expect(new Set(said).size).toBe(said.length);
    },
  );

  it('draws each way with an icon of its own that the app has', () => {
    const icons = Object.values(RUN_WALK_LOOKS).map(({ icon }) => icon);

    expect(icons.every((icon) => icon in ICONS)).toBe(true);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
