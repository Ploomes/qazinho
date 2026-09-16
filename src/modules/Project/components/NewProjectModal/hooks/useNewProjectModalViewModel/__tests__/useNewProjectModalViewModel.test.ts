// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useNewProjectModalViewModel } from '@/modules/Project/components/NewProjectModal/hooks/useNewProjectModalViewModel';
import { useAppStore } from '@/store';

beforeEach(() => {
  window.gocrash = { platform: 'darwin' };
  useAppStore.setState({ projects: [], modal: 'project' });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'gocrash');
});

describe('useNewProjectModalViewModel', () => {
  it('cannot create a project with no name and no target', () => {
    const { result } = renderHook(() => useNewProjectModalViewModel());

    expect(result.current.canCreate).toBe(false);
  });

  it('cannot create a project that has a name but nothing to test', () => {
    const { result } = renderHook(() => useNewProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
    });

    expect(result.current.canCreate).toBe(false);
  });

  it('creates the project with the targets that were filled in', () => {
    const { result } = renderHook(() => useNewProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
      result.current.onUrlChange('https://staging.shop.test');
    });
    act(() => {
      result.current.onCreate();
    });

    const [project] = useAppStore.getState().projects;

    expect(project?.name).toBe('Shop · staging');
    expect(project?.targets).toHaveLength(1);
    expect(project?.targets[0]?.kind).toBe('web');
    expect(useAppStore.getState().modal).toBeNull();
  });

  it('turns iOS off when Xcode is not there, even on a Mac', () => {
    const { result } = renderHook(() => useNewProjectModalViewModel());

    expect(result.current.isMac).toBe(true);
    expect(result.current.isIosAvailable).toBe(false);
    expect(result.current.xcodeNote).toBe('Xcode not found');
  });

  it('says iOS is macOS only anywhere else', () => {
    window.gocrash = { platform: 'win32' };

    const { result } = renderHook(() => useNewProjectModalViewModel());

    expect(result.current.xcodeNote).toBe('macOS only');
    expect(result.current.footerHint).toContain('iOS needs macOS');
  });
});
