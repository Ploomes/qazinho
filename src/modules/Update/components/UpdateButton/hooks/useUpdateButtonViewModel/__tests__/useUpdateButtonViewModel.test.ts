// @vitest-environment jsdom
import type { IWorkspace } from '@/modules/Workspace';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateButtonViewModel } from '@/modules/Update/components/UpdateButton/hooks/useUpdateButtonViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { NO_UPDATE } from '@/services/Updates';
import { useUpdateStore, useWorkspaceStore } from '@/store';
import '@/languages';

const going = [{ live: { isDone: false } }] as unknown as IWorkspace[];

beforeEach(() => {
  useUpdateStore.setState({
    update: { phase: 'ready', version: '0.2.0', isRequired: false },
  });
  useWorkspaceStore.setState({ workspaces: [] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
  useUpdateStore.setState({ update: NO_UPDATE });
});

describe('useUpdateButtonViewModel', () => {
  it('appears only once a version is ready', () => {
    expect(renderHook(() => useUpdateButtonViewModel()).result.current.isShown).toBe(
      true,
    );

    useUpdateStore.setState({
      update: { phase: 'downloading', version: '0.2.0', percent: 40, isRequired: false },
    });

    expect(renderHook(() => useUpdateButtonViewModel()).result.current.isShown).toBe(
      false,
    );
  });

  it('names the version it will install', () => {
    const { result } = renderHook(() => useUpdateButtonViewModel());

    expect(result.current.tip).toContain('0.2.0');
  });

  it('installs on a click', () => {
    const installUpdate = vi.fn(() => Promise.resolve());

    window.qazinho = { ...fakeQazinhoApi('darwin'), installUpdate };

    renderHook(() => useUpdateButtonViewModel()).result.current.onClick();

    expect(installUpdate).toHaveBeenCalledOnce();
  });

  // Instalar reinicia o app, e isso derrubaria a run no meio.
  it('does NOT install while a run is going, and says when it can', () => {
    const installUpdate = vi.fn(() => Promise.resolve());

    window.qazinho = { ...fakeQazinhoApi('darwin'), installUpdate };
    useWorkspaceStore.setState({ workspaces: going });

    const { result } = renderHook(() => useUpdateButtonViewModel());

    result.current.onClick();

    expect(installUpdate).not.toHaveBeenCalled();
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tip).not.toContain('0.2.0');
  });
});
