import type { IAgentLine } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { toToolCalls } from '@/main/classes/agents/AgentRunner/library';

const turn = (content: NonNullable<IAgentLine['message']>['content']): IAgentLine => ({
  type: 'assistant',
  message: { content },
});

describe('the tools a turn called', () => {
  it('names a tool of the device without its server, with what it aims at', () => {
    expect(
      toToolCalls(
        turn([
          { type: 'tool_use', name: 'mcp__qazinho__click', input: { target: 'Salvar' } },
        ]),
      ),
    ).toEqual([{ tool: 'click', target: 'Salvar' }]);
  });

  /** O valor de um `fill` pode ser um segredo: só o rótulo do campo sai daqui. */
  it('never carries what is typed', () => {
    const [call] = toToolCalls(
      turn([
        {
          type: 'tool_use',
          name: 'mcp__qazinho__fill',
          input: { target: 'Senha', value: 'hunter2' },
        },
      ]),
    );

    expect(call).toEqual({ tool: 'fill', target: 'Senha' });
    expect(JSON.stringify(call)).not.toContain('hunter2');
  });

  it('takes the title of a bug', () => {
    expect(
      toToolCalls(
        turn([
          {
            type: 'tool_use',
            name: 'mcp__qazinho__bug',
            input: { title: 'Total errado', expected: 'a', got: 'b' },
          },
        ]),
      ),
    ).toEqual([{ tool: 'bug', target: 'Total errado' }]);
  });

  it('reads every Figma tool as one', () => {
    expect(
      toToolCalls(
        turn([{ type: 'tool_use', name: 'mcp__figma__get_design_context', input: {} }]),
      ),
    ).toEqual([{ tool: 'figma', target: '' }]);
  });

  it('keeps a tool of the agent itself by its name', () => {
    expect(
      toToolCalls(
        turn([{ type: 'tool_use', name: 'Read', input: { file_path: '/a/b.ts' } }]),
      ),
    ).toEqual([{ tool: 'Read', target: '/a/b.ts' }]);
  });

  it('skips what is not a tool call, and any other line', () => {
    expect(toToolCalls(turn([{ type: 'text', text: 'oi' }]))).toEqual([]);
    expect(toToolCalls({ type: 'result' })).toEqual([]);
  });
});
