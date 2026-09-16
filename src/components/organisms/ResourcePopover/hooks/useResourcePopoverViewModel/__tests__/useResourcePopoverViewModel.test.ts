// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useResourcePopoverViewModel } from '@/components/organisms/ResourcePopover/hooks/useResourcePopoverViewModel';
import { useMachineStore } from '@/store';

const PROCESSES = [
  { pid: 1240, name: 'claude', cpu: 4, ramMb: 430 },
  { pid: 1300, name: 'Chromium', cpu: 12, ramMb: 1800 },
];

beforeEach(() => {
  useMachineStore.setState({
    resources: { cpu: 16, ramMb: 2230, ramCeilingGb: 32, processes: PROCESSES },
  });
});

describe('useResourcePopoverViewModel', () => {
  it('counts what the machine is really running', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.header).toBe('2 running · 2.2 GB');
  });

  it('puts the heaviest process first, because that is the one to shut down', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.processes[0]?.name).toBe('Chromium');
  });

  it('says so plainly when the machine is quiet', () => {
    useMachineStore.setState({
      resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
    });

    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.header).toBe('nothing running');
    expect(result.current.processes).toEqual([]);
  });
});
