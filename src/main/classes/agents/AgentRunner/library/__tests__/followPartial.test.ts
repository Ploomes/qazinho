import type { ILiveBlock } from '@/main/classes/agents/AgentRunner/types';
import type { IAgentLine } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { followPartial } from '@/main/classes/agents/AgentRunner/library';

const event = (given: NonNullable<IAgentLine['event']>): IAgentLine => ({
  type: 'stream_event',
  event: given,
});

const start = (content_block: { type: string; name?: string }) =>
  event({ type: 'content_block_start', content_block });

const delta = (given: { type: string; text?: string; partial_json?: string }) =>
  event({ type: 'content_block_delta', delta: given });

function walk(lines: IAgentLine[]): (string | null)[] {
  let block: ILiveBlock | null = null;

  return lines.map((line) => {
    const followed = followPartial({ line, block });

    block = followed.block;

    return followed.said;
  });
}

describe('following the words the CLI writes', () => {
  it('hands over the text of the block so far, a piece at a time', () => {
    expect(
      walk([
        start({ type: 'text' }),
        delta({ type: 'text_delta', text: '\nOi' }),
        delta({ type: 'text_delta', text: ', QA' }),
      ]),
    ).toEqual([null, 'Oi', 'Oi, QA']);
  });

  /** O chat responde por uma chamada de ferramenta, com o texto dentro de um JSON. */
  it('reads the reply out of the answer the turn ends with', () => {
    expect(
      walk([
        start({ type: 'tool_use', name: 'StructuredOutput' }),
        delta({ type: 'input_json_delta', partial_json: '' }),
        delta({ type: 'input_json_delta', partial_json: '{"reply": "Testar' }),
        delta({ type: 'input_json_delta', partial_json: ' é bom' }),
      ]),
    ).toEqual([null, null, 'Testar', 'Testar é bom']);
  });

  it('says nothing about thinking or about another tool', () => {
    expect(
      walk([
        start({ type: 'thinking' }),
        delta({ type: 'thinking_delta', text: 'hmm' }),
        start({ type: 'tool_use', name: 'mcp__qazinho__click' }),
        delta({ type: 'input_json_delta', partial_json: '{"reply": "no' }),
      ]),
    ).toEqual([null, null, null, null]);
  });

  it('starts over with each block', () => {
    expect(
      walk([
        start({ type: 'text' }),
        delta({ type: 'text_delta', text: 'first' }),
        event({ type: 'content_block_stop' }),
        start({ type: 'text' }),
        delta({ type: 'text_delta', text: 'second' }),
      ]),
    ).toEqual([null, 'first', null, null, 'second']);
  });

  it('ignores an agent working inside the agent', () => {
    expect(
      walk([
        { ...start({ type: 'text' }), parent_tool_use_id: 'toolu_1' },
        { ...delta({ type: 'text_delta', text: 'x' }), parent_tool_use_id: 'toolu_1' },
      ]),
    ).toEqual([null, null]);
  });

  it('leaves every other line alone', () => {
    expect(walk([{ type: 'assistant' }, { type: 'result' }])).toEqual([null, null]);
  });
});
