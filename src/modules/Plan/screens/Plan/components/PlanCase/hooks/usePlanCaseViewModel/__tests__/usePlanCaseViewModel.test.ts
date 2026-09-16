// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlanCaseViewModel } from '@/modules/Plan/screens/Plan/components/PlanCase/hooks/usePlanCaseViewModel';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';

const TEST_CASE = CASES[0]!;
const PROPS = { testCase: TEST_CASE, isOpen: false, isLocked: false, onToggle: vi.fn() };

describe('usePlanCaseViewModel', () => {
  it('numbers the steps as the table shows them', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.steps.map(({ number }) => number)).toEqual([1, 2, 3]);
  });

  it('reads a case that has never run as not run', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.verdict).toBe('pending');
  });

  it('turns the caret down once the case is open', () => {
    const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, isOpen: true }));

    expect(result.current.caret).toBe('▾');
  });

  it('asks for its own case to be toggled, not another', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, onToggle }));

    result.current.onHeadClick();

    expect(onToggle).toHaveBeenCalledWith('TC-01');
  });
});
