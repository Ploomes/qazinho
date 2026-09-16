// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useModelInUse } from '@/modules/Settings/hooks';
import { useMachineStore, useSettingsStore } from '@/store';

const CLAUDE = {
  id: 'claude-code',
  name: 'Claude Code',
  command: 'claude',
  isFound: true,
  path: '/bin/claude',
  defaultModel: 'opus[1m]',
};

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Claude Code', model: '' });
  useMachineStore.setState({ agents: [CLAUDE] });
});

describe('useModelInUse', () => {
  it('names the model the agent config sets while the QA keeps the default', () => {
    expect(renderHook(() => useModelInUse()).result.current.modelName).toBe('opus[1m]');
  });

  it('names the model the QA picked over the agent default', () => {
    useSettingsStore.setState({ model: 'haiku' });

    expect(renderHook(() => useModelInUse()).result.current.modelName).toBe('Haiku');
  });

  it('says default when the agent config names no model', () => {
    useMachineStore.setState({ agents: [{ ...CLAUDE, defaultModel: null }] });

    expect(renderHook(() => useModelInUse()).result.current.modelName).toBe(
      'Agent default',
    );
  });
});
