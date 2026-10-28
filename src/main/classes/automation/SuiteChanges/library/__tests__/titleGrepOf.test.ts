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

  /**
   * Um teste que desceu no arquivo depois de um conserto tem uma linha nova, então a
   * checagem o acha pelo título.
   */
  it('never matches a test whose title only looks alike', () => {
    expect(new RegExp(titleGrepOf('Saves 1+1 items'), 'gi').test('Saves 11 items')).toBe(
      false,
    );
  });
});
