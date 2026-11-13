// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETUP_LINKS } from '@/modules/Setup/constants';
import { useStepDevicesViewModel } from '@/modules/Setup/screens/Onboarding/components/StepDevices/hooks/useStepDevicesViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSetupStore } from '@/store';

const MANAGERS = {
  npm: { isFound: true, path: '/bin/npm' },
  brew: { isFound: true, path: '/opt/homebrew/bin/brew' },
};

beforeEach(() => {
  useMachineStore.setState({
    tools: {
      androidSdk: { isFound: true, path: '/Users/qa/Library/Android/sdk' },
      xcode: { isFound: false, path: null },
      axe: { isFound: false, path: null },
    },
  });
  useSetupStore.setState({ managers: MANAGERS, installs: {}, isChecking: false });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useStepDevicesViewModel', () => {
  it('shows a found SDK with no path and no link to get it', () => {
    const { result } = renderHook(() => useStepDevicesViewModel());

    expect(result.current.android).toMatchObject({
      state: 'found',
      detail: undefined,
      link: null,
    });
  });

  it('points at Xcode when it is missing, because it is too big to install from here', () => {
    const { result } = renderHook(() => useStepDevicesViewModel());

    expect(result.current.xcode).toMatchObject({
      state: 'missing',
      link: SETUP_LINKS.xcode,
    });
  });

  it('asks to check again while a tool is missing, and NOT once every tool is found', () => {
    const missing = renderHook(() => useStepDevicesViewModel());

    expect(missing.result.current).toMatchObject({ hasNote: true, canCheckAgain: true });

    useMachineStore.setState({
      tools: {
        androidSdk: { isFound: true, path: '/Users/qa/Library/Android/sdk' },
        xcode: { isFound: true, path: '/Applications/Xcode.app' },
        axe: { isFound: true, path: '/Users/qa/.local/bin/axe' },
      },
    });
    const ready = renderHook(() => useStepDevicesViewModel());

    expect(ready.result.current).toMatchObject({ hasNote: false, canCheckAgain: false });
  });

  it('offers to install AXe when it is missing on a Mac', () => {
    const { result } = renderHook(() => useStepDevicesViewModel());

    expect(result.current.axe.canInstall).toBe(true);
  });

  it('still offers AXe without Homebrew, because the release is a plain binary', () => {
    useSetupStore.setState({
      managers: { ...MANAGERS, brew: { isFound: false, path: null } },
    });
    const { result } = renderHook(() => useStepDevicesViewModel());

    expect(result.current.axe.canInstall).toBe(true);
  });

  it('turns the iOS tools off away from a Mac', () => {
    window.qazinho = fakeQazinhoApi('linux');
    const { result } = renderHook(() => useStepDevicesViewModel());

    expect(result.current.xcode).toMatchObject({ state: 'off', link: null });
    expect(result.current.axe.canInstall).toBe(false);
  });

  describe('onInstallAxe', () => {
    it('installs AXe', () => {
      const install = vi.spyOn(window.qazinho, 'installTool');
      const { result } = renderHook(() => useStepDevicesViewModel());

      act(() => {
        result.current.onInstallAxe();
      });

      expect(install).toHaveBeenCalledWith('axe');
    });
  });
});
