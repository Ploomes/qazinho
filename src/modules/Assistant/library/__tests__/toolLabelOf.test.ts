import { describe, expect, it } from 'vitest';
import { toolLabelOf } from '@/modules/Assistant/library';

describe('toolLabelOf', () => {
  it('says the run it reads, or that it reads the latest one', () => {
    expect(
      toolLabelOf({ name: 'run_details', args: { workspace: 'w1', run: 'r-02' } }),
    ).toEqual({
      doing: 'ASSISTANT.TOOL_RUN_DETAILS',
      done: 'ASSISTANT.TOOL_RUN_DETAILS_DONE',
    });
    expect(toolLabelOf({ name: 'run_details', args: { workspace: 'w1' } })).toEqual({
      doing: 'ASSISTANT.TOOL_LATEST_RUN',
      done: 'ASSISTANT.TOOL_LATEST_RUN_DONE',
    });
  });

  it('says every other tool by its own name', () => {
    expect(toolLabelOf({ name: 'go_home', args: {} }).done).toBe(
      'ASSISTANT.TOOL_GO_HOME_DONE',
    );
  });
});
