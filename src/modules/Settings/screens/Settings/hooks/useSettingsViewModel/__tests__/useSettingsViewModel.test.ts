// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsViewModel } from '@/modules/Settings/screens/Settings/hooks/useSettingsViewModel';
import { useAppStore, useSettingsStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ theme: 'dark' });
  useSettingsStore.setState({
    tab: 'agents',
    agent: 'Claude Code',
    model: 'sonnet',
    integrations: { github: false, jira: false },
  });
});

describe('useSettingsViewModel', () => {
  it('opens on the agents panel, because nothing runs without one', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.tab).toBe('agents');
    expect(result.current.tabs).toHaveLength(6);
  });

  it('lists the models of the agent that is selected', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.models.map(({ id }) => id)).toEqual([
      'haiku',
      'sonnet',
      'opus',
      'fable',
    ]);
  });

  describe('onSelectAgent', () => {
    it('falls back to the first model of the agent it moved to', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onSelectAgent('Codex');
      });

      expect(useSettingsStore.getState().model).toBe('mini');
    });

    it('leaves no model at all for an agent that has none', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onSelectAgent('Gemini CLI');
      });

      expect(useSettingsStore.getState().model).toBe('');
    });
  });

  describe('onToggleIntegration', () => {
    it('connects and disconnects one tracker without touching the other', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onToggleIntegration('github');
      });

      expect(useSettingsStore.getState().integrations).toEqual({
        github: true,
        jira: false,
      });
    });
  });

  describe('onToggleTheme', () => {
    it('switches the theme the whole window reads from', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onToggleTheme();
      });

      expect(useAppStore.getState().theme).toBe('light');
    });
  });
});
