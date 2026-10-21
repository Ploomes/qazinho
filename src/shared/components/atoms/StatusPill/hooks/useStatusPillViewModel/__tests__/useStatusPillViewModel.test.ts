// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { useStatusPillViewModel } from '@/shared/components/atoms/StatusPill/hooks/useStatusPillViewModel';

describe('useStatusPillViewModel', () => {
  it('says the word that goes with the status, not only the colour', () => {
    const { result } = renderHook(() => useStatusPillViewModel({ status: 'attention' }));

    expect(result.current.label).toBe('needs you');
    expect(result.current.icon).toBe('attention');
  });

  it('reads a step that has not run yet as not run, not as idle', () => {
    const { result } = renderHook(() => useStatusPillViewModel({ status: 'pending' }));

    expect(result.current.label).toBe('not run');
  });

  it('lets the caller override the word, for the live step counter', () => {
    const { result } = renderHook(() =>
      useStatusPillViewModel({ status: 'running', label: 'running · step 2 of 6' }),
    );

    expect(result.current.label).toBe('running · step 2 of 6');
    expect(result.current.icon).toBe('running');
  });

  it('is square unless it is asked to be round', () => {
    const square = renderHook(() => useStatusPillViewModel({ status: 'passed' }));
    const round = renderHook(() =>
      useStatusPillViewModel({ status: 'passed', shape: 'round' }),
    );

    expect(square.result.current.className).toContain('status-pill--square');
    expect(round.result.current.className).toContain('status-pill--round');
  });
});

describe('STATUS', () => {
  it('gives every status a key of its own', () => {
    const keys = Object.values(STATUS).map(({ labelKey }) => labelKey);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
