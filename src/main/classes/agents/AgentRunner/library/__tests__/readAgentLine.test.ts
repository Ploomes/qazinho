import { describe, expect, it } from 'vitest';
import { readAgentLine } from '@/main/classes/agents/AgentRunner/library';

describe('readAgentLine', () => {
  it('reads a line of the agent stream', () => {
    expect(readAgentLine('{"type":"result","result":"ok"}')).toEqual({
      type: 'result',
      result: 'ok',
    });
  });

  it('ignores the blank line between events', () => {
    expect(readAgentLine('   ')).toBeNull();
  });

  it('ignores anything the CLI printed that is not json', () => {
    expect(readAgentLine('Loading plugins…')).toBeNull();
  });

  it('ignores a line that arrived half written', () => {
    expect(readAgentLine('{"type":"resu')).toBeNull();
  });
});
