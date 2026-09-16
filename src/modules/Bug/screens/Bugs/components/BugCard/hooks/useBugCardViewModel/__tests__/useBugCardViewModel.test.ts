// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBugCardViewModel } from '@/modules/Bug/screens/Bugs/components/BugCard/hooks/useBugCardViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});
const BUG = WORKSPACE.bugs[0]!;
const PROPS = {
  bug: BUG,
  isOpen: false,
  onToggle: vi.fn(),
  onOpenRun: vi.fn(),
  onOpenCase: vi.fn(),
};

describe('useBugCardViewModel', () => {
  it('says where the bug came from, so a developer can find it again', () => {
    const { result } = renderHook(() => useBugCardViewModel(PROPS));

    expect(result.current.meta.map(({ key }) => key)).toEqual([
      'run',
      'case',
      'target',
      'seen',
      'agent',
    ]);
    expect(result.current.meta[1]?.value).toBe('TC-02 · step 2');
  });

  it('turns the caret down once the card is open', () => {
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, isOpen: true }));

    expect(result.current.caret).toBe('▾');
  });

  it('toggles its own bug', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onToggle }));

    result.current.onHeadClick();

    expect(onToggle).toHaveBeenCalledWith('BUG-01');
  });
});
