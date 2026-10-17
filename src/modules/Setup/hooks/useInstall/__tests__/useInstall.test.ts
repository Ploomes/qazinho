// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInstall } from '@/modules/Setup/hooks/useInstall';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSetupStore } from '@/store';

beforeEach(() => {
  useSetupStore.setState({ installs: {} });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useInstall', () => {
  it('installs, then looks at the machine again so the new tool shows up', async () => {
    const check = vi.spyOn(window.qazinho, 'checkMachine');
    const { result } = renderHook(() => useInstall());

    await act(() => result.current.install('claude-code'));

    expect(useSetupStore.getState().installs['claude-code']).toEqual({
      phase: 'installed',
    });
    expect(check).toHaveBeenCalledOnce();
  });

  it('keeps the error and does NOT look again when the install fails', async () => {
    window.qazinho.installTool = vi
      .fn()
      .mockResolvedValue({ isInstalled: false, error: 'EACCES', command: 'npm i -g x' });
    const check = vi.spyOn(window.qazinho, 'checkMachine');
    const { result } = renderHook(() => useInstall());

    await act(() => result.current.install('codex'));

    expect(useSetupStore.getState().installs.codex).toEqual({
      phase: 'failed',
      error: 'EACCES',
      command: 'npm i -g x',
    });
    expect(check).not.toHaveBeenCalled();
  });

  it('does NOT start a second install of a tool already installing', async () => {
    useSetupStore.setState({
      installs: { idb: { phase: 'installing', stage: 2, stages: 4, line: '' } },
    });
    const install = vi.spyOn(window.qazinho, 'installTool');
    const { result } = renderHook(() => useInstall());

    await act(() => result.current.install('idb'));

    expect(install).not.toHaveBeenCalled();
  });
});
