import { describe, expect, it } from 'vitest';
import { titleGrepOf } from '@/main/classes/automation/SuiteChanges/library';

describe('titleGrepOf', () => {
  it('matches the title as it is written', () => {
    const grep = new RegExp(
      titleGrepOf('CT-NAV-002 · Abre o carrinho (menu) [v2]'),
      'gi',
    );

    expect(
      grep.test(
        'chromium ct-nav.spec.ts CT-NAV · CT-NAV-002 · Abre o carrinho (menu) [v2]',
      ),
    ).toBe(true);
  });

  /** A test moved down the file after a fix has a new line, so the check finds it by its title. */
  it('never matches a test whose title only looks alike', () => {
    expect(new RegExp(titleGrepOf('Saves 1+1 items'), 'gi').test('Saves 11 items')).toBe(
      false,
    );
  });
});
