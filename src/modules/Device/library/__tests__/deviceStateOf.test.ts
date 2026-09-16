import { describe, expect, it } from 'vitest';
import { deviceStateOf } from '@/modules/Device/library';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const RUNNING = startRun({
  workspace: makeWorkspace(),
  startedAt: '09:41',
  runId: 'r-01',
});

describe('deviceStateOf', () => {
  it('stays off until a run asks for it', () => {
    expect(deviceStateOf(makeWorkspace())).toBe('off');
    expect(deviceStateOf(null)).toBe('off');
  });

  it('is driving while the agent works', () => {
    expect(deviceStateOf(RUNNING)).toBe('driving');
  });

  it('holds when the run is paused, which is not the same as stopped', () => {
    const paused = { ...RUNNING, live: { ...RUNNING.live!, isRunning: false } };

    expect(deviceStateOf(paused)).toBe('holding');
  });

  it('is stopped once the run is over', () => {
    const done = { ...RUNNING, live: { ...RUNNING.live!, isDone: true } };

    expect(deviceStateOf(done)).toBe('stopped');
  });
});
