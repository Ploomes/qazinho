// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWelcomeViewModel } from '@/modules/Project/screens/Welcome/hooks/useWelcomeViewModel';
import { useAppStore } from '@/store';

const SHOP = { id: 'p1', name: 'Shop · staging', targets: [], repositories: [] };
const APP = { id: 'p2', name: 'App test', targets: [], repositories: [] };

beforeEach(() => {
  useAppStore.setState({ modal: null, projects: [], selectedProjectId: null });
});

describe('useWelcomeViewModel', () => {
  it('asks for a first project while there is none', () => {
    const { result } = renderHook(() => useWelcomeViewModel());

    expect(result.current.title).toBe('No projects yet.');
    expect(result.current.mood).toBe('sleeping');
  });

  it('does NOT say there is no project once one exists: it points to a workspace', () => {
    useAppStore.setState({ projects: [SHOP] });

    const { result } = renderHook(() => useWelcomeViewModel());

    expect(result.current.title).toBe('Pick a workspace, or start a new one.');
    expect(result.current.body).toContain('Shop · staging');
    expect(result.current.action).toBe('New workspace');
  });

  describe('onSettings', () => {
    /**
     * Não há sidebar antes do primeiro projeto, então as Configurações não tinham
     * entrada.
     */
    it('leads to Settings while there is no project', () => {
      const { result } = renderHook(() => useWelcomeViewModel());

      expect(result.current.settings).toBe('Settings');

      act(() => {
        result.current.onSettings();
      });

      expect(useAppStore.getState().screen).toBe('settings');
    });

    it('does NOT offer it once a project exists: the sidebar has it', () => {
      useAppStore.setState({ projects: [SHOP] });

      expect(renderHook(() => useWelcomeViewModel()).result.current.settings).toBeNull();
    });
  });

  describe('onAction', () => {
    it('opens the project modal while there is no project', () => {
      const { result } = renderHook(() => useWelcomeViewModel());

      act(() => {
        result.current.onAction();
      });

      expect(useAppStore.getState().modal).toBe('project');
    });

    it('opens a new workspace in the project last picked', () => {
      useAppStore.setState({ projects: [SHOP, APP], selectedProjectId: 'p2' });

      const { result } = renderHook(() => useWelcomeViewModel());

      act(() => {
        result.current.onAction();
      });

      expect(useAppStore.getState()).toMatchObject({
        modal: 'workspace',
        selectedProjectId: 'p2',
      });
    });
  });
});
