import { describe, expect, it } from 'vitest';
import { TOOL_GRANTS } from '@/harness/tools/constants';

describe('TOOL_GRANTS', () => {
  it('hands the device to the runner only: the chat talks, it never touches the device', () => {
    const device = TOOL_GRANTS.find(({ group }) => group === 'device');

    expect(device?.roles).toEqual(['runner']);
  });

  it('hands the app to the assistant only: a run or a chat never renames, runs or deletes', () => {
    const app = TOOL_GRANTS.find(({ group }) => group === 'app');

    expect(app?.roles).toEqual(['assistant']);
  });
});
