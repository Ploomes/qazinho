import type { BugCategory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { bugFlashHeadlineOf } from '@/modules/Device/library';

describe('the big phrase of a caught bug', () => {
  it('says the kind of bug', () => {
    expect(bugFlashHeadlineOf({ category: 'text', isDesign: false })).toBe(
      'DEVICE.BUG_TEXT',
    );
  });

  it('holds it against Figma when the bug is against a design', () => {
    expect(bugFlashHeadlineOf({ category: 'layout', isDesign: true })).toBe(
      'DEVICE.BUG_LAYOUT_DESIGN',
    );
  });

  it('still says Figma when the agent gave no kind', () => {
    expect(bugFlashHeadlineOf({ category: null, isDesign: true })).toBe(
      'DEVICE.BUG_DESIGN',
    );
  });

  it('has none to say with no kind and no design', () => {
    expect(bugFlashHeadlineOf({ category: null, isDesign: false })).toBeNull();
  });

  it('has a phrase in the language for every kind, with and without a design', () => {
    const kinds: BugCategory[] = ['layout', 'text', 'style', 'behavior', 'data', 'error'];

    for (const category of kinds)
      for (const isDesign of [false, true]) {
        const [, name = ''] = (bugFlashHeadlineOf({ category, isDesign }) ?? '').split(
          '.',
        );

        expect(en.DEVICE).toHaveProperty(name);
      }
  });
});
