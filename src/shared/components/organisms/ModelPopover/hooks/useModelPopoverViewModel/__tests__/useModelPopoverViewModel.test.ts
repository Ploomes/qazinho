// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useModelPopoverViewModel } from '@/shared/components/organisms/ModelPopover/hooks/useModelPopoverViewModel';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

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

  /** O padrão do agente aparecia como o id cru da config dele, "claude-fable-5-2". */
  it('names the agent own default the way a person says it', () => {
    useMachineStore.setState({
      agents: [
        {
          id: 'claude',
          name: 'Claude Code',
          command: 'claude',
          isFound: true,
          path: '/usr/local/bin/claude',
          defaultModel: 'claude-fable-5-2',
          isSignedIn: true,
        },
      ],
    });

    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.models[0]?.note).toBe('Fable 5.2');
  });

  it('leaves the default with nothing beside it when the agent config names no model', () => {
    useMachineStore.setState({ agents: [] });

    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.models[0]?.note).toBeNull();
  });

  /** O Fable vinha cinza por um cadeado que sobrou dos dados de mentira do protótipo. */
  it('offers every model it lists, none of them greyed out', () => {
    const { result } = renderHook(() => useModelPopoverViewModel());

    expect(result.current.models.every((one) => !('isLocked' in one))).toBe(true);
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
