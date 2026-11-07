// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useVariableFormViewModel } from '@/modules/Project/components/VariableForm/hooks/useVariableFormViewModel';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useVariableFormViewModel', () => {
  it('hides what is typed for a secret, and shows it for a value that is none', () => {
    const secret = renderHook(() =>
      useVariableFormViewModel({ isSecret: true, onSecret: vi.fn() }),
    );
    const plain = renderHook(() =>
      useVariableFormViewModel({ isSecret: false, onSecret: vi.fn() }),
    );

    expect(secret.result.current).toMatchObject({
      isShown: false,
      eyeIcon: 'eye',
      eyeLabel: 'Show the value',
    });
    expect(plain.result.current).toMatchObject({
      isShown: true,
      eyeIcon: 'eyeSlash',
      eyeLabel: 'Hide the value',
    });
  });

  it('shows a secret while the QA types it, when asked, and hides it again', () => {
    const { result } = renderHook(() =>
      useVariableFormViewModel({ isSecret: true, onSecret: vi.fn() }),
    );

    act(() => {
      result.current.onEye();
    });

    expect(result.current.isShown).toBe(true);

    act(() => {
      result.current.onEye();
    });

    expect(result.current.isShown).toBe(false);
  });

  it('hides the value again once the QA makes it a secret', () => {
    const onSecret = vi.fn();
    const { result, rerender } = renderHook(
      ({ isSecret }) => useVariableFormViewModel({ isSecret, onSecret }),
      { initialProps: { isSecret: false } },
    );

    act(() => {
      result.current.onSecretSwitch(true);
    });
    rerender({ isSecret: true });

    expect(onSecret).toHaveBeenCalledWith(true);
    expect(result.current.isShown).toBe(false);
  });
});
