import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adoptDataDir } from '@/main/library';

function folders() {
  const root = mkdtempSync(join(tmpdir(), 'qazinho-adopt-'));
  const from = join(root, 'gocrash');
  const to = join(root, 'QAzinho');

  mkdirSync(join(from, 'workspaces', 'w1'), { recursive: true });
  writeFileSync(join(from, 'projects.json'), '[{"id":"p1"}]');
  writeFileSync(
    join(from, 'workspaces', 'w1', 'workspace.json'),
    JSON.stringify({ shot: join(from, 'runs', 'w1', 'r-01', 'step-1.jpg') }),
  );

  return { from, to };
}

describe('adoptDataDir', () => {
  it('copies the projects and workspaces over, and leaves the old folder alone', () => {
    const { from, to } = folders();

    expect(adoptDataDir({ from, to })).toBe(true);
    expect(readFileSync(join(to, 'projects.json'), 'utf8')).toBe('[{"id":"p1"}]');
    expect(existsSync(join(from, 'projects.json'))).toBe(true);
  });

  it('points the screenshots of a run at the new folder', () => {
    const { from, to } = folders();

    adoptDataDir({ from, to });

    expect(readFileSync(join(to, 'workspaces', 'w1', 'workspace.json'), 'utf8')).toBe(
      JSON.stringify({ shot: join(to, 'runs', 'w1', 'r-01', 'step-1.jpg') }),
    );
  });

  it('does NOT touch a new folder that already holds work', () => {
    const { from, to } = folders();

    mkdirSync(to, { recursive: true });
    writeFileSync(join(to, 'projects.json'), '[]');

    expect(adoptDataDir({ from, to })).toBe(false);
    expect(readFileSync(join(to, 'projects.json'), 'utf8')).toBe('[]');
  });

  it('has nothing to do on a machine that never ran the old app', () => {
    const root = mkdtempSync(join(tmpdir(), 'qazinho-adopt-'));

    expect(adoptDataDir({ from: join(root, 'gocrash'), to: join(root, 'QAzinho') })).toBe(
      false,
    );
    expect(existsSync(join(root, 'QAzinho'))).toBe(false);
  });
});
