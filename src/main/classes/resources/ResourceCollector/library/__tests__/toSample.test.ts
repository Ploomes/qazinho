import { describe, expect, it } from 'vitest';
import { toSample } from '@/main/classes/resources/ResourceCollector/library';

const ROW = {
  pid: 1240,
  parentPid: 1,
  cpuSeconds: 12,
  ramMb: 430.7,
  name: '/Users/qa/.local/bin/claude',
  command: '/Users/qa/.local/bin/claude --print',
};

describe('toSample', () => {
  it('shows the program, not the path it happens to live at', () => {
    const sample = toSample({ row: ROW, cpu: 4.26, kind: 'agent', workspaceId: 'w1' });

    expect(sample.name).toBe('claude');
  });

  it('rounds what a person reads: one decimal of cpu, whole megabytes', () => {
    const sample = toSample({ row: ROW, cpu: 4.26, kind: 'agent', workspaceId: 'w1' });

    expect(sample.cpu).toBe(4.3);
    expect(sample.ramMb).toBe(431);
  });

  it('carries who it belongs to, because the tree is grouped by that', () => {
    const sample = toSample({ row: ROW, cpu: 4.26, kind: 'app', workspaceId: null });

    expect(sample).toMatchObject({ kind: 'app', workspaceId: null, pid: 1240 });
  });
});
