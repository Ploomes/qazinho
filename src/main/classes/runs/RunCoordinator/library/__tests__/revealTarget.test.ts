import { describe, expect, it, vi } from 'vitest';
import { revealTarget } from '@/main/classes/runs/RunCoordinator/library';

describe('revealTarget', () => {
  /** Os mockups estavam abaixo da tela: o bug foi lido no texto, e a foto nunca o mostrou. */
  it('scrolls to the thing a bug points at before its screen is kept', async () => {
    const reveal = vi.fn(() => Promise.resolve(true));

    await revealTarget({
      driver: { reveal },
      target: 'Fresh pão de queijo',
      category: 'text',
    });

    expect(reveal).toHaveBeenCalledWith('Fresh pão de queijo');
  });

  it('does NOT scroll for a bug about something that did not happen', async () => {
    const reveal = vi.fn(() => Promise.resolve(true));

    await revealTarget({ driver: { reveal }, target: 'Save', category: 'behavior' });
    await revealTarget({ driver: { reveal } });

    expect(reveal).not.toHaveBeenCalled();
  });

  it('keeps the bug when the device cannot scroll or the target is gone', async () => {
    await expect(revealTarget({ driver: {}, target: 'Total' })).resolves.toBeUndefined();
    await expect(
      revealTarget({
        driver: { reveal: () => Promise.reject(new Error('gone')) },
        target: 'Total',
      }),
    ).resolves.toBeUndefined();
  });
});
