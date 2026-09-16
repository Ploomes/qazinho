// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProjectModalViewModel } from '@/modules/Project/components/ProjectModal/hooks/useProjectModalViewModel';
import { fakeGocrashApi } from '@/services/__tests__/fixtures';
import { useAppStore } from '@/store';

beforeEach(() => {
  window.gocrash = fakeGocrashApi('darwin');
  useAppStore.setState({ projects: [], modal: 'project' });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'gocrash');
});

describe('useProjectModalViewModel', () => {
  it('cannot create a project with no name and no target', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.canCreate).toBe(false);
  });

  it('cannot create a project that has a name but nothing to test', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
    });

    expect(result.current.canCreate).toBe(false);
  });

  it('creates the project with the targets that were filled in', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

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
    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.isMac).toBe(true);
    expect(result.current.isIosAvailable).toBe(false);
    expect(result.current.xcodeNote).toBe('Xcode not found');
  });

  it('says iOS is macOS only anywhere else', () => {
    window.gocrash = fakeGocrashApi('win32');

    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.xcodeNote).toBe('macOS only');
  });

  describe('footerHint', () => {
    it('says what is missing first, which is the name', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.footerHint).toBe('Name the project to create it');
    });

    it('asks for a target once the project has a name', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
      });

      expect(result.current.footerHint).toBe('Add one target: a URL, an .apk or a .app');
    });

    it('says nothing once the button can be pressed', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
        result.current.onUrlChange('https://staging.shop.test');
      });

      expect(result.current.footerHint).toBeUndefined();
      expect(result.current.canCreate).toBe(true);
    });
  });
});
