import { describe, expect, it } from 'vitest';
import { hasProject } from '@/main/classes/pro/ProDownloads/library';

describe('hasProject', () => {
  it('finds a project this computer keeps by its id', () => {
    expect(hasProject({ text: '[{"id":"p1","name":"Loja"}]', projectId: 'p1' })).toBe(
      true,
    );
  });

  it('does NOT find one it does not keep', () => {
    expect(hasProject({ text: '[{"id":"p1"}]', projectId: 'p2' })).toBe(false);
  });

  it('finds nothing in a file that is missing or does not read', () => {
    expect(hasProject({ text: null, projectId: 'p1' })).toBe(false);
    expect(hasProject({ text: '{ broken', projectId: 'p1' })).toBe(false);
    expect(hasProject({ text: '{"id":"p1"}', projectId: 'p1' })).toBe(false);
  });
});
