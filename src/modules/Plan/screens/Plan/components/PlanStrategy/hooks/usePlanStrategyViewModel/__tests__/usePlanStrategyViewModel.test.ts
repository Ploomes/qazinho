// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePlanStrategyViewModel } from '@/modules/Plan/screens/Plan/components/PlanStrategy/hooks';

const STRATEGY = {
  covers: 'Applying a coupon at checkout',
  leavesOut: 'The admin that creates coupons',
  where: 'Staging, on the web',
  data: '',
  risks: 'A coupon that stacks with free shipping',
};

describe('usePlanStrategyViewModel', () => {
  /** A estratégia fica numa linha dobrada: ela orienta o plano, e os casos são o trabalho. */
  it('starts folded on what the plan covers, and opens on a click', () => {
    const { result } = renderHook(() => usePlanStrategyViewModel({ strategy: STRATEGY }));

    expect(result.current).toMatchObject({
      label: 'Strategy',
      summary: 'Applying a coupon at checkout',
      isOpen: false,
      isShown: true,
    });

    act(() => {
      result.current.onToggle();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('lists each part the agent wrote, and leaves the empty ones out', () => {
    const { result } = renderHook(() => usePlanStrategyViewModel({ strategy: STRATEGY }));

    expect(result.current.rows.map(({ label, text }) => `${label}: ${text}`)).toEqual([
      'Covers: Applying a coupon at checkout',
      'Leaves out: The admin that creates coupons',
      'Where: Staging, on the web',
      'Risks: A coupon that stacks with free shipping',
    ]);
  });

  it('shows nothing for a strategy with nothing in it', () => {
    const { result } = renderHook(() =>
      usePlanStrategyViewModel({
        strategy: { covers: ' ', leavesOut: '', where: '', data: '', risks: '' },
      }),
    );

    expect(result.current).toMatchObject({ isShown: false, summary: '' });
  });
});
