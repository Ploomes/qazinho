// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlanCaseViewModel } from '@/modules/Plan/screens/Plan/components/PlanCase/hooks/usePlanCaseViewModel';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';

const TEST_CASE = CASES[0]!;

const PROPS = {
  testCase: TEST_CASE,
  isOpen: false,
  isLocked: false,
  onToggle: vi.fn(),
  onEditCase: vi.fn(),
  onRemoveCase: vi.fn(),
  onAddStep: vi.fn(),
  onRemoveStep: vi.fn(),
  onEditStep: vi.fn(),
};

describe('usePlanCaseViewModel', () => {
  it('numbers the steps as the table shows them', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.steps.map(({ number }) => number)).toEqual([1, 2, 3]);
  });

  it('links each step to the Figma frame its screen should match', () => {
    const design = {
      url: 'https://www.figma.com/design/AbC123/Shop?node-id=1-2',
      fileKey: 'AbC123',
      nodeId: '1:2',
      name: 'Shop',
    };
    const testCase = {
      ...TEST_CASE,
      steps: [{ ...TEST_CASE.steps[0]!, frame: '12:345' }, ...TEST_CASE.steps.slice(1)],
    };
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, testCase, design }),
    );

    expect(result.current.steps[0]?.frame).toEqual({
      label: 'frame 12:345',
      url: 'https://www.figma.com/design/AbC123/Shop?node-id=12-345',
      title: 'Open this frame in Figma',
    });
    expect(result.current.steps[1]?.frame).toBeNull();
  });

  it('does NOT link a frame once the workspace has no design', () => {
    const testCase = {
      ...TEST_CASE,
      steps: [{ ...TEST_CASE.steps[0]!, frame: '12:345' }],
    };

    expect(
      renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase, design: null })).result
        .current.steps[0]?.frame,
    ).toBeNull();
  });

  it('shows each step as it went in the last run', () => {
    const lastRun = {
      id: TEST_CASE.id,
      title: TEST_CASE.title,
      verdict: 'failed' as const,
      durationSec: 4,
      steps: [
        {
          number: 1,
          action: '',
          verdict: 'passed' as const,
          why: null,
          bugId: null,
          shot: null,
          shotFile: null,
          span: null,
        },
        {
          number: 2,
          action: '',
          verdict: 'failed' as const,
          why: null,
          bugId: null,
          shot: null,
          shotFile: null,
          span: null,
        },
      ],
    };
    const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

    expect(
      result.current.steps.map(({ verdict, verdictIcon }) => [verdict, verdictIcon]),
    ).toEqual([
      ['passed', 'passed'],
      ['failed', 'failed'],
      ['pending', 'pending'],
    ]);
  });

  it('does NOT invent a verdict for a case the last run never reached', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(
      result.current.steps.every(({ verdictLabel }) => verdictLabel === 'not run'),
    ).toBe(true);
  });

  it('reads a case that has never run as not run', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.verdict).toBe('pending');
  });

  it('asks for its own case to be toggled, not another', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, onToggle }));

    result.current.onHeadClick();

    expect(onToggle).toHaveBeenCalledWith('TC-01');
  });

  it('names its own case on every change it asks for', () => {
    const onEditStep = vi.fn();
    const onEditCase = vi.fn();
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, onEditStep, onEditCase }),
    );

    result.current.onStepCommit({ index: 1, step: { action: 'Search' } });
    result.current.onFieldCommit({ title: 'Search' });

    expect(onEditStep).toHaveBeenCalledWith({
      caseId: 'TC-01',
      index: 1,
      step: { action: 'Search' },
    });
    expect(onEditCase).toHaveBeenCalledWith({
      caseId: 'TC-01',
      fields: { title: 'Search' },
    });
  });

  it('does NOT offer to remove the only step a case has', () => {
    const oneStep = { ...TEST_CASE, steps: [TEST_CASE.steps[0]!] };
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, testCase: oneStep }),
    );

    expect(result.current.canRemoveStep).toBe(false);
  });

  it('does NOT offer to remove a step while the agent is running the plan', () => {
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, isLocked: true }),
    );

    expect(result.current.canRemoveStep).toBe(false);
  });

  describe('picking a case up', () => {
    it('lifts it as a sticker while it is dragged, and lays it flat once dropped', () => {
      const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

      expect(result.current.className).toBe('plan-case');

      act(() => {
        result.current.onPickUp();
      });

      expect(result.current.className).toBe('plan-case plan-case--picked');

      act(() => {
        result.current.onPutDown();
      });

      expect(result.current.className).toBe('plan-case');
    });
  });
});
