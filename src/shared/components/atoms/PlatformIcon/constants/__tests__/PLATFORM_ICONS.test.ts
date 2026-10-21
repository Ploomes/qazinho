// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { PLATFORM_ICONS } from '@/shared/components/atoms/PlatformIcon/constants';

describe('PLATFORM_ICONS', () => {
  it('draws every platform a target can be with a logo of its own', () => {
    const icons = (['web', 'android', 'ios'] as const).map(
      (kind) => PLATFORM_ICONS[kind],
    );

    expect(new Set(icons).size).toBe(3);
  });

  it('draws iOS as Apple, the maker a QA knows it by', () => {
    expect(PLATFORM_ICONS.ios).toBe('apple');
  });
});
