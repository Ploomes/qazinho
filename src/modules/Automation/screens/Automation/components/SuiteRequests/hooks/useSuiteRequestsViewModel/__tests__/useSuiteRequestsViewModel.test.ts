// @vitest-environment jsdom
import type { ISuiteChange } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSuiteRequestsViewModel } from '@/modules/Automation/screens/Automation/components/SuiteRequests/hooks/useSuiteRequestsViewModel';

const REQUEST = {
  id: 'c-02',
  status: 'working',
  ask: { kind: 'write', text: 'The cart keeps its items.', folder: '', source: null },
} as ISuiteChange;

describe('useSuiteRequestsViewModel', () => {
  it('lists each new test asked for with how it stands, the one picked marked', () => {
    const { result } = renderHook(() =>
      useSuiteRequestsViewModel({
        requests: [REQUEST],
        pickedId: 'c-02',
        onPick: vi.fn(),
      }),
    );

    expect(result.current).toMatchObject({
      isShown: true,
      label: 'Asked of the agent',
      rows: [
        {
          key: 'c-02',
          title: 'The cart keeps its items.',
          icon: 'running',
          word: 'The agent is writing it',
          className: 'suite-requests__row suite-requests__row--picked',
        },
      ],
    });
  });

  it('picks a request by its change', () => {
    const onPick = vi.fn();
    const { result } = renderHook(() =>
      useSuiteRequestsViewModel({ requests: [REQUEST], pickedId: null, onPick }),
    );

    result.current.rows[0]?.onPick();

    expect(onPick).toHaveBeenCalledWith('c-02');
  });

  it('shows nothing before anything was asked', () => {
    expect(
      renderHook(() =>
        useSuiteRequestsViewModel({ requests: [], pickedId: null, onPick: vi.fn() }),
      ).result.current.isShown,
    ).toBe(false);
  });
});
