import { describe, expect, it } from 'vitest';
import { TOOL_GRANTS } from '@/harness/tools/constants';

describe('TOOL_GRANTS', () => {
  it('hands the device to the runner only: the chat talks, it never touches the device', () => {
    const device = TOOL_GRANTS.find(({ group }) => group === 'device');

    expect(device?.roles).toEqual(['runner']);
  });
});
