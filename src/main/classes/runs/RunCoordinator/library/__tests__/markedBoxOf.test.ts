import { describe, expect, it, vi } from 'vitest';
import { markedBoxOf } from '@/main/classes/runs/RunCoordinator/library';

const BOX = { x: 0.1, y: 0.2, width: 0.3, height: 0.1 };

describe('where a bug points on the screen', () => {
  it('finds what the agent named', async () => {
    const locate = vi.fn(() => Promise.resolve(BOX));

    await expect(
      markedBoxOf({ driver: { locate }, target: 'Salvar', inspected: 'Título' }),
    ).resolves.toEqual(BOX);
    expect(locate).toHaveBeenCalledWith('Salvar');
  });

  /** Num bug contra o design o agente acabou de medir a coisa: ela é o que está errado. */
  it('falls back on what was just measured, for a bug against a design', async () => {
    const locate = vi.fn(() => Promise.resolve(BOX));

    await markedBoxOf({ driver: { locate }, frame: '12:34', inspected: 'Título' });

    expect(locate).toHaveBeenCalledWith('Título');
  });

  it('guesses nothing for a bug that names nothing and has no design', async () => {
    const locate = vi.fn(() => Promise.resolve(BOX));

    await expect(
      markedBoxOf({ driver: { locate }, inspected: 'Título' }),
    ).resolves.toBeNull();
    expect(locate).not.toHaveBeenCalled();
  });

  it('says nothing when the thing is not on the screen, or the device cannot tell', async () => {
    await expect(
      markedBoxOf({
        driver: { locate: () => Promise.reject(new Error('gone')) },
        target: 'Salvar',
        inspected: null,
      }),
    ).resolves.toBeNull();
    await expect(
      markedBoxOf({ driver: {}, target: 'Salvar', inspected: null }),
    ).resolves.toBeNull();
  });
});
