import { describe, expect, it, vi } from 'vitest';
import { MARKED_BOX } from '@/main/classes/runs/RunCoordinator/constants';
import { markedBoxOf } from '@/main/classes/runs/RunCoordinator/library';

const BOX = { x: 0.1, y: 0.2, width: 0.3, height: 0.1 };

describe('where a bug points on the screen', () => {
  it('finds the one thing the agent named', async () => {
    const locate = vi.fn(() => Promise.resolve(BOX));

    await expect(
      markedBoxOf({ driver: { locate }, target: 'Salvar', category: 'text' }),
    ).resolves.toEqual(BOX);
    expect(locate).toHaveBeenCalledWith('Salvar');
  });

  /** Um bug contra o design que não aponta nada não é sobre o que foi medido por último. */
  it('guesses nothing for a bug that names nothing', async () => {
    const locate = vi.fn(() => Promise.resolve(BOX));

    await expect(markedBoxOf({ driver: { locate } })).resolves.toBeNull();
    expect(locate).not.toHaveBeenCalled();
  });

  /** A foto de algo que não aconteceu não tem o que mostrar de perto. */
  it('does NOT point at anything when something did not do what it should', async () => {
    const locate = vi.fn(() => Promise.resolve(BOX));

    await expect(
      markedBoxOf({ driver: { locate }, target: 'Salvar', category: 'behavior' }),
    ).resolves.toBeNull();
    expect(locate).not.toHaveBeenCalled();
  });

  it('leaves the whole picture when the thing fills much of the screen', async () => {
    const big = { x: 0.1, y: 0.1, width: 0.7, height: 0.6 };

    expect(big.width * big.height).toBeGreaterThan(MARKED_BOX.maxCover);
    await expect(
      markedBoxOf({
        driver: { locate: () => Promise.resolve(big) },
        target: 'Painel',
      }),
    ).resolves.toBeNull();
  });

  it('still points at something wide and short, like a banner', async () => {
    const banner = { x: 0, y: 0, width: 1, height: 0.1 };

    await expect(
      markedBoxOf({
        driver: { locate: () => Promise.resolve(banner) },
        target: 'Aviso',
      }),
    ).resolves.toEqual(banner);
  });

  it('says nothing when the thing is not on the screen, or the device cannot tell', async () => {
    await expect(
      markedBoxOf({
        driver: { locate: () => Promise.reject(new Error('gone')) },
        target: 'Salvar',
      }),
    ).resolves.toBeNull();
    await expect(markedBoxOf({ driver: {}, target: 'Salvar' })).resolves.toBeNull();
  });
});
