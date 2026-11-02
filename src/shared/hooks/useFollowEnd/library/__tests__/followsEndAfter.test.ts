import { describe, expect, it } from 'vitest';
import { followsEndAfter } from '@/shared/hooks/useFollowEnd/library';

const LIST = { clientHeight: 400, scrollHeight: 2000, edgePx: 48 };

describe('followsEndAfter', () => {
  it('follows when the list sits within the small margin of its end', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: false, top: 1560, previousTop: 1000 }),
    ).toBe(true);
    expect(
      followsEndAfter({ ...LIST, wasFollowing: false, top: 1552, previousTop: 1600 }),
    ).toBe(true);
  });

  it('stops following when the reader scrolls up past the margin', () => {
    expect(
      followsEndAfter({ ...LIST, wasFollowing: true, top: 1500, previousTop: 1600 }),
    ).toBe(false);
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
