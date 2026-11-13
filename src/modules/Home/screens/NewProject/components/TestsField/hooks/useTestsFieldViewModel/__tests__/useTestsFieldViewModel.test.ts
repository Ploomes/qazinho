// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTestsFieldViewModel } from '@/modules/Home/screens/NewProject/components/TestsField/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const SOURCE = {
  name: 'loja-web',
  dir: '/Users/qa/code/loja-web',
  frameworks: [{ id: 'playwright', files: 2 }],
  files: ['tests/checkout.spec.ts', 'tests/busca.spec.ts'],
  branch: 'main',
  commit: null,
};

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useTestsFieldViewModel', () => {
  it('hands up the folder it read, with the framework it recognized', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      pickImport: () => Promise.resolve({ kind: 'picked' as const, source: SOURCE }),
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTestsFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onPick();
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(SOURCE);
    });
  });

  it('says why a folder could not be used, and keeps nothing', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      pickImport: () =>
        Promise.resolve({ kind: 'failed' as const, reason: 'empty' as const }),
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTestsFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onPick();
    });

    await waitFor(() => {
      expect(result.current.statusText).toBe('That folder has no files to read.');
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('names the framework and how many test files the folder has', () => {
    const { result } = renderHook(() =>
      useTestsFieldViewModel({ value: SOURCE, onChange: vi.fn() }),
    );

    expect(result.current).toMatchObject({
      statusText: 'playwright · 2 test files in loja-web',
      pickLabel: 'Another folder',
      path: '/Users/qa/code/loja-web',
    });
  });
});
