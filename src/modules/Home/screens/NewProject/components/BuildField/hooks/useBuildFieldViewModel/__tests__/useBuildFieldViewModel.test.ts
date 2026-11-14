// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBuildFieldViewModel } from '@/modules/Home/screens/NewProject/components/BuildField/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBuildFieldViewModel', () => {
  it('keeps one build per platform, the newest one', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      pickFile: () => Promise.resolve('/builds/loja-1.5.apk'),
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useBuildFieldViewModel({
        value: [
          { kind: 'android', path: '/builds/loja-1.4.apk' },
          { kind: 'ios', path: '/builds/Loja.app' },
        ],
        onChange,
      }),
    );

    act(() => {
      result.current.onPickApk();
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        { kind: 'ios', path: '/builds/Loja.app' },
        { kind: 'android', path: '/builds/loja-1.5.apk' },
      ]);
    });
  });

  it('changes nothing when the QA closes the picker', async () => {
    const pickFile = vi.fn(() => Promise.resolve(null));

    window.qazinho = { ...fakeQazinhoApi('darwin'), pickFile };
    const onChange = vi.fn();
    const { result } = renderHook(() => useBuildFieldViewModel({ value: [], onChange }));

    act(() => {
      result.current.onPickApp();
    });

    await waitFor(() => {
      expect(pickFile).toHaveBeenCalled();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('names each chosen build by its platform and file, and hints when there is none', () => {
    const chosen = renderHook(() =>
      useBuildFieldViewModel({
        value: [{ kind: 'android', path: '/builds/loja-1.4.apk' }],
        onChange: vi.fn(),
      }),
    ).result.current;
    const empty = renderHook(() =>
      useBuildFieldViewModel({ value: [], onChange: vi.fn() }),
    ).result.current;

    expect(chosen.statusText).toBe('Android · loja-1.4.apk');
    expect(empty.statusClassName).toBe('field-card__status');
  });
});
