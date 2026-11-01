// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useErrorBlockViewModel } from '@/modules/Chat/screens/Chat/components/ErrorBlock/hooks/useErrorBlockViewModel';

const MESSAGE = {
  id: 'm-1',
  kind: 'error' as const,
  runId: 'r-01',
  at: '18:37',
  text: 'A run parou: Command failed: idb ui describe-all',
  detail: 'Command failed: idb ui describe-all\nidb: no running simulator',
  fix: null,
};

describe('useErrorBlockViewModel', () => {
  it('offers the detail, collapsed, when the error carries one', () => {
    const { result } = renderHook(() => useErrorBlockViewModel({ message: MESSAGE }));

    expect(result.current.hasDetail).toBe(true);
    expect(result.current.isExpanded).toBe(false);
    expect(result.current.detail).toContain('no running simulator');
  });

  it('opens and closes the detail on toggle', () => {
    const { result } = renderHook(() => useErrorBlockViewModel({ message: MESSAGE }));

    act(() => {
      result.current.onToggle();
    });
    expect(result.current.isExpanded).toBe(true);
    expect(result.current.toggleLabel).toBe('Hide details');

    act(() => {
      result.current.onToggle();
    });
    expect(result.current.isExpanded).toBe(false);
    expect(result.current.toggleLabel).toBe('See details');
  });

  it('offers no detail when the error has none, or only blank', () => {
    const none = renderHook(() =>
      useErrorBlockViewModel({ message: { ...MESSAGE, detail: null } }),
    );
    expect(none.result.current.hasDetail).toBe(false);

    const blank = renderHook(() =>
      useErrorBlockViewModel({ message: { ...MESSAGE, detail: '   ' } }),
    );
    expect(blank.result.current.hasDetail).toBe(false);
  });
});
