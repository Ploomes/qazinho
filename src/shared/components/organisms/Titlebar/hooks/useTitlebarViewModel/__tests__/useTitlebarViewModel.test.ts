// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useTitlebarViewModel } from '@/shared/components/organisms/Titlebar/hooks/useTitlebarViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({
    isResourcesOpen: false,
    modelMenuAt: null,
  });
});

describe('useTitlebarViewModel', () => {
  it('keeps only the drag strip during the first-run setup', () => {
    const { result } = renderHook(() => useTitlebarViewModel({ isBare: true }));

    expect(result.current.isBare).toBe(true);
    expect(result.current.className).toContain('titlebar--bare');
  });

  describe('the window controls', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
    });

    it("leaves room for the Mac's traffic lights on the left", () => {
      window.qazinho = fakeQazinhoApi('darwin');

      expect(renderHook(() => useTitlebarViewModel()).result.current.className).toContain(
        'titlebar--mac',
      );
    });

    it("leaves room for Windows' and Linux's own controls on the right", () => {
      window.qazinho = fakeQazinhoApi('win32');

      const { className } = renderHook(() => useTitlebarViewModel()).result.current;

      expect(className).toContain('titlebar--overlay');
      expect(className).not.toContain('titlebar--mac');
    });
  });

  it('shows the whole bar everywhere else', () => {
    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.isBare).toBe(false);
    expect(result.current.className).not.toContain('titlebar--bare');
  });

  describe('crumbs', () => {
    const LOJA = { id: 'p1', name: 'Loja Web', targets: [], repositories: [] };

    it('says where the QA is: Home, a plan in its project, or Settings', () => {
      useAppStore.setState({
        projects: [LOJA],
        screen: 'welcome',
        selectedWorkspaceId: null,
      });
      expect(
        renderHook(() => useTitlebarViewModel()).result.current.crumbs.map(
          ({ label }) => label,
        ),
      ).toEqual(['Home']);

      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
      useAppStore.setState({
        projects: [LOJA],
        screen: 'workspace',
        selectedWorkspaceId: 'w1',
      });
      expect(
        renderHook(() => useTitlebarViewModel()).result.current.crumbs.map(
          ({ label }) => label,
        ),
      ).toEqual(['Loja Web', 'Checkout regression']);

      useAppStore.setState({ screen: 'settings' });
      expect(
        renderHook(() => useTitlebarViewModel()).result.current.crumbs.map(
          ({ label }) => label,
        ),
      ).toEqual(['Settings']);
    });

    it('names the Usage screen', () => {
      useAppStore.setState({
        projects: [LOJA],
        screen: 'usage',
        selectedWorkspaceId: null,
      });

      expect(
        renderHook(() => useTitlebarViewModel()).result.current.crumbs.map(
          ({ label }) => label,
        ),
      ).toEqual(['Usage']);
    });

    it('marks the plan as the crumb the QA renames', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
      useAppStore.setState({
        projects: [LOJA],
        screen: 'workspace',
        selectedWorkspaceId: 'w1',
      });

      expect(
        renderHook(() => useTitlebarViewModel()).result.current.crumbs.map(
          ({ isPlan }) => isPlan,
        ),
      ).toEqual([false, true]);
    });

    it('renames the open plan, so the sidebar and the disk follow', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
      useAppStore.setState({
        projects: [LOJA],
        screen: 'workspace',
        selectedWorkspaceId: 'w1',
      });

      const { result } = renderHook(() => useTitlebarViewModel());

      act(() => {
        result.current.onRename('Checkout');
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.name).toBe('Checkout');
    });

    it('does NOT offer the sidebar before the first project', () => {
      useAppStore.setState({ projects: [], screen: 'welcome' });

      expect(renderHook(() => useTitlebarViewModel()).result.current).toMatchObject({
        crumbs: [],
      });
    });
  });
});
