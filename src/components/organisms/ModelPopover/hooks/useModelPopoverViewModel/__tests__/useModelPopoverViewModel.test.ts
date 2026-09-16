// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useModelPopoverViewModel } from '@/components/organisms/ModelPopover/hooks/useModelPopoverViewModel';
import { useSettingsStore } from '@/store';

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Claude Code', model: 'sonnet' });
});

describe('useModelPopoverViewModel', () => {
  it('lists the models of the agent on this machine', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.modelHeading).toBe('model');
    expect(result.current.models).toHaveLength(4);
  });

  it('says there is nothing to pick for an agent that exposes no model', () => {
    useSettingsStore.setState({ agent: 'Gemini CLI' });

    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.modelHeading).toBe('no models to pick');
  });

  it('moves the model with the agent', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    act(() => {
      result.current.onSelectAgent('Codex');
    });

    expect(useSettingsStore.getState().model).toBe('mini');
  });
});
