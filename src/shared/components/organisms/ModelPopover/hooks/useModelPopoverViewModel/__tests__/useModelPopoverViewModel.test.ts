// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useModelPopoverViewModel } from '@/shared/components/organisms/ModelPopover/hooks/useModelPopoverViewModel';
import { useAppStore, useSettingsStore } from '@/store';

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Claude Code', model: 'sonnet' });
});

describe('useModelPopoverViewModel', () => {
  it('offers the agent own default first, then the models it lists', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.modelHeading).toBe('Model');
    expect(result.current.models.map(({ id }) => id)).toEqual([
      '',
      'haiku',
      'sonnet',
      'opus',
      'fable',
    ]);
  });

  it('names each model with nothing to read beside it', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.models.find(({ id }) => id === 'haiku')?.note).toBeNull();
  });

  it('still offers the agent default for an agent that lists no models', () => {
    useSettingsStore.setState({ agent: 'An agent QAzinho has no model list for' });

    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.models.map(({ id }) => id)).toEqual(['']);
  });

  /** Escolher o modelo deixava o menu aberto, e ele só fechava com Esc. */
  it('closes the menu once a model is picked, and not when the agent changes', () => {
    useAppStore.setState({ modelMenuAt: 'composer' });

    const { result } = renderHook(() => useModelPopoverViewModel());

    act(() => {
      result.current.onSelectAgent('Claude Code');
    });

    expect(useAppStore.getState().modelMenuAt).toBe('composer');

    act(() => {
      result.current.onSelectModel('');
    });

    expect(useAppStore.getState().modelMenuAt).toBeNull();
  });

  it('moves to the agent own default model when the agent changes', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    act(() => {
      result.current.onSelectAgent('Codex');
    });

    expect(useSettingsStore.getState().model).toBe('');
  });

  it('does NOT reset the model when the agent in use is clicked', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    act(() => {
      result.current.onSelectAgent('Claude Code');
    });

    expect(useSettingsStore.getState().model).toBe('sonnet');
  });

  it('closes when the QA presses anywhere outside it', () => {
    useAppStore.setState({ modelMenuAt: 'composer' });
    renderHook(() => useModelPopoverViewModel());

    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });

    expect(useAppStore.getState().modelMenuAt).toBeNull();
  });
});
