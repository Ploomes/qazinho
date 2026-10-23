import type { IAgentLine } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { toActions } from '@/main/classes/agents/AgentRunner/library';

const turn = (content: NonNullable<IAgentLine['message']>['content']): IAgentLine => ({
  type: 'assistant',
  message: { content },
});

describe('toActions', () => {
  it('says the command a turn runs, on one line', () => {
    expect(
      toActions(
        turn([
          { type: 'text', text: 'Building it.' },
          {
            type: 'tool_use',
            name: 'Bash',
            input: { command: 'cd android && ./gradlew assembleDebug\necho done' },
          },
        ]),
      ),
    ).toEqual(['$ cd android && ./gradlew assembleDebug']);
  });

  it('says the file a turn writes, by its name', () => {
    expect(
      toActions(
        turn([
          {
            type: 'tool_use',
            name: 'Write',
            input: { file_path: '/b/src/android/local.properties' },
          },
        ]),
      ),
    ).toEqual(['✎ local.properties']);
  });

  it('cuts a long command short', () => {
    const [action] = toActions(
      turn([
        { type: 'tool_use', name: 'Bash', input: { command: `echo ${'a'.repeat(300)}` } },
      ]),
    );

    expect(action?.length).toBeLessThanOrEqual(162);
    expect(action?.endsWith('…')).toBe(true);
  });

  it('leaves no line for reading, talking, or a line that is not a turn', () => {
    expect(
      toActions(turn([{ type: 'tool_use', name: 'Read', input: { file_path: '/x' } }])),
    ).toEqual([]);
    expect(toActions(turn([{ type: 'text', text: 'Hi' }]))).toEqual([]);
    expect(toActions({ type: 'result', result: 'Done' })).toEqual([]);
  });

  it('names a file a turn writes on Windows by its name too', () => {
    expect(
      toActions(
        turn([
          {
            type: 'tool_use',
            name: 'Write',
            input: { file_path: 'C:\\b\\android\\local.properties' },
          },
        ]),
      ),
    ).toEqual(['✎ local.properties']);
  });
});
