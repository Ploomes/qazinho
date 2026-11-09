import { describe, expect, it } from 'vitest';
import { designFrameOf } from '@/main/classes/runs/RunCoordinator/library';

describe('designFrameOf', () => {
  const name = 'mcp__figma__get_screenshot';

  it('reads the frame from a screenshot of the Figma server, in the form bugs name it', () => {
    expect(designFrameOf({ name, input: { nodeId: '12:345' } })).toBe('12:345');
    expect(designFrameOf({ name, input: { nodeId: '12-345' } })).toBe('12:345');
  });

  it('does NOT take another tool, or a call that names no frame', () => {
    expect(
      designFrameOf({ name: 'mcp__figma__get_metadata', input: { nodeId: '1:2' } }),
    ).toBeNull();
    expect(
      designFrameOf({ name: 'mcp__other__get_screenshot', input: { nodeId: '1:2' } }),
    ).toBeNull();
    expect(designFrameOf({ name, input: {} })).toBeNull();
    expect(designFrameOf({ name, input: undefined })).toBeNull();
  });
});
