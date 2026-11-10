// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBrokenRegionViewModel } from '..';

const errorOf = (stack: string | undefined) => {
  const error = new Error('category is not known');
  error.stack = stack;
  return error;
};

describe('title', () => {
  it('names the region that broke', () => {
    const { result } = renderHook(() =>
      useBrokenRegionViewModel({ region: 'chat', error: errorOf('x'), onRetry: vi.fn() }),
    );

    expect(result.current.title).toBe('The chat broke');
    expect(result.current.className).toBe('broken-region broken-region--chat');
  });
});

describe('detail', () => {
  it('shows the stack when there is one', () => {
    const { result } = renderHook(() =>
      useBrokenRegionViewModel({
        region: 'tab',
        error: errorOf('Error: boom\n  at x'),
        onRetry: vi.fn(),
      }),
    );

    expect(result.current.detail).toBe('Error: boom\n  at x');
  });

  it('falls back to the name and message without a stack', () => {
    const { result } = renderHook(() =>
      useBrokenRegionViewModel({
        region: 'tab',
        error: errorOf(undefined),
        onRetry: vi.fn(),
      }),
    );

    expect(result.current.detail).toBe('Error: category is not known');
  });
});

describe('onToggle', () => {
  it('opens and closes the details', () => {
    const { result } = renderHook(() =>
      useBrokenRegionViewModel({ region: 'tab', error: errorOf('x'), onRetry: vi.fn() }),
    );

    act(() => result.current.onToggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.onToggle());
    expect(result.current.isOpen).toBe(false);
  });
});

describe('onCopy', () => {
  it('copies the error and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() =>
      useBrokenRegionViewModel({
        region: 'tab',
        error: errorOf('Error: boom'),
        onRetry: vi.fn(),
      }),
    );

    await act(async () => {
      result.current.onCopy();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('Error: boom');
    expect(result.current.copyLabel).toBe('Copied');
  });
});

describe('onRetry', () => {
  it('hands the reload to the barrier', () => {
    const onRetry = vi.fn();
    const { result } = renderHook(() =>
      useBrokenRegionViewModel({ region: 'tab', error: errorOf('x'), onRetry }),
    );

    result.current.onRetry();

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
