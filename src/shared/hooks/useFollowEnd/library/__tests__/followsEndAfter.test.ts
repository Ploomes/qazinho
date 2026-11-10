import { describe, expect, it } from 'vitest';
import { followsEndAfter } from '@/shared/hooks/useFollowEnd/library';

const LIST = {
  clientHeight: 400,
  scrollHeight: 2000,
  edgePx: 48,
  leaveEdgePx: 2,
  byUser: true,
};

describe('followsEndAfter', () => {
  it('follows when the list sits within the small margin of its end', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: false, top: 1560, previousTop: 1000 }),
    ).toBe(true);
    expect(
      followsEndAfter({ ...LIST, wasFollowing: false, top: 1599, previousTop: 1600 }),
    ).toBe(true);
  });

  /** Quem sobe uma linha para ler não pode ser puxado de volta pelo próximo passo. */
  it('stops following at the smallest scroll up', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: true, top: 1570, previousTop: 1600 }),
    ).toBe(false);
  });

  it('stops following when the reader scrolls up past the margin', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: true, top: 1500, previousTop: 1600 }),
    ).toBe(false);
  });

  /**
   * O navegador sobe a lista sozinho quando algo acima dela encolhe, como as linhas do que o
   * agente fazia dando lugar à resposta: isso desligava o acompanhamento sem ninguém rolar.
   */
  it('keeps following when the list moves up without the reader', () => {
    expect(
      followsEndAfter({
        ...LIST,
        byUser: false,
        wasFollowing: true,
        top: 1300,
        previousTop: 1600,
      }),
    ).toBe(true);
  });

  /** Soltar a barra de rolagem perto do fim religa, mesmo com um tremido para cima. */
  it('follows again when a drag is let go near the end', () => {
    expect(
      followsEndAfter({
        ...LIST,
        byUser: false,
        wasFollowing: false,
        top: 1570,
        previousTop: 1570,
      }),
    ).toBe(true);
  });

  /** Um scroll suave passa longe do fim enquanto desce, e não pode se desligar. */
  it('keeps following while its own scroll is still on the way down', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: true, top: 900, previousTop: 500 }),
    ).toBe(true);
  });

  it('does NOT start following from a scroll down that stops short of the end', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: false, top: 900, previousTop: 500 }),
    ).toBe(false);
  });
});
