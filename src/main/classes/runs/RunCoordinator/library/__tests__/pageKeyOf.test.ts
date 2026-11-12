import { describe, expect, it } from 'vitest';
import { pageKeyOf } from '@/main/classes/runs/RunCoordinator/library';

describe('pageKeyOf', () => {
  /** Um link âncora só rola a página: não é uma tela nova para o explorador. */
  it('treats an anchor on the same page as the same page', () => {
    expect(pageKeyOf('https://shop.test/#products')).toBe(
      pageKeyOf('https://shop.test/'),
    );
  });

  it('tells another path or another query apart', () => {
    expect(pageKeyOf('https://shop.test/pt')).not.toBe(pageKeyOf('https://shop.test/'));
    expect(pageKeyOf('https://shop.test/?tab=2')).toBe('https://shop.test/?tab=2');
  });
});
