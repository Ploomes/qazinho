import { describe, expect, it } from 'vitest';
import { PRO_SWITCH } from '@/shared/constants';

describe('PRO_SWITCH', () => {
  /**
   * O site da plataforma saiu do ar, e sem ele ninguém entra numa conta: o Pro fica fora do app,
   * e nada dele fala com a API, até a plataforma voltar.
   */
  it('keeps the Pro out of the app', () => {
    expect(PRO_SWITCH.isOn).toBe(false);
  });
});
