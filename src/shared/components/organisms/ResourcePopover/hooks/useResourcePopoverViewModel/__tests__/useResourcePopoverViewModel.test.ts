// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { sample } from '@/modules/Resources/library/__tests__/fixtures';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useResourcePopoverViewModel } from '@/shared/components/organisms/ResourcePopover/hooks/useResourcePopoverViewModel';
import { useAppStore, useMachineStore, useWorkspaceStore } from '@/store';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [], repositories: [] };

const PROCESSES = [
  sample({ name: 'qazinho', kind: 'app', ramMb: 300 }),
  sample({ name: 'claude', kind: 'agent', workspaceId: 'w1', ramMb: 430 }),
  sample({ name: 'Google Chrome', kind: 'device', workspaceId: 'w1', ramMb: 1500 }),
];

beforeEach(() => {
  useAppStore.setState({ projects: [PROJECT] });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
  useMachineStore.setState({
    resources: { cpu: 16, ramMb: 2230, ramCeilingGb: 32, processes: PROCESSES },
  });
});

describe('useResourcePopoverViewModel', () => {
  it('counts what the machine is really running', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.header).toBe('3 running · 2.2 GB');
  });

  it('shows QAzinho itself above the projects it is running', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.nodes.map(({ id }) => id)).toEqual([
      'qazinho',
      'p1',
      'w1',
      'w1-agent',
      'w1-device',
    ]);
  });

  it('counts the processes a line adds up in the language the QA reads', async () => {
    useMachineStore.setState({
      resources: {
        cpu: 16,
        ramMb: 2230,
        ramCeilingGb: 32,
        processes: [
          ...PROCESSES,
          sample({ name: 'qazinho helper', kind: 'app', ramMb: 100 }),
          sample({ name: 'Google Chrome Helper', kind: 'device', workspaceId: 'w1' }),
        ],
      },
    });
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.nodes[0]?.name).toBe('QAzinho · 2 processos');
    expect(result.current.nodes.at(-1)?.name).toBe('Google Chrome · 2 processos');
    await i18n.changeLanguage('en');
  });

  it('names a line that is one process after that process alone', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.nodes[0]?.name).toBe('QAzinho');
    expect(result.current.nodes.at(-1)?.name).toBe('Google Chrome');
  });

  it('offers to shut down the device, and nothing else', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.nodes.filter(({ canShutDown }) => canShutDown)).toHaveLength(1);
  });

  it('says so plainly when the machine is quiet', () => {
    useMachineStore.setState({
      resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
    });

    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.header).toBe('nothing running');
    expect(result.current.nodes).toEqual([]);
  });
});
