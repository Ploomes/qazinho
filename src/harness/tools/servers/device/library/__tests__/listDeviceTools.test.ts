import { describe, expect, it } from 'vitest';
import { listDeviceTools } from '@/harness/tools/servers/device/library';

describe('listDeviceTools', () => {
  it('lists the actions, then the tool the agent reports with', () => {
    expect(listDeviceTools().map(({ name }) => name)).toEqual([
      'look',
      'goto',
      'click',
      'fill',
      'press',
      'wait',
      'report',
    ]);
  });

  it('gives every tool an object schema with no "$schema" key and no stray field', () => {
    for (const tool of listDeviceTools()) {
      expect(tool.inputSchema).toMatchObject({
        type: 'object',
        additionalProperties: false,
      });
      expect(tool.inputSchema).not.toHaveProperty('$schema');
    }
  });
});
