import { describe, expect, it } from 'vitest';
import { toToolImages } from '@/main/classes/agents/AgentRunner/library';

describe('toToolImages', () => {
  it('reads each image a tool answered, with the call that asked for it', () => {
    expect(
      toToolImages({
        type: 'user',
        message: {
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'call-1',
              content: [
                { type: 'image', source: { media_type: 'image/png', data: 'AAAA' } },
                { type: 'text' },
              ],
            },
          ],
        },
      }),
    ).toEqual([{ callId: 'call-1', mediaType: 'image/png', data: 'AAAA' }]);
  });

  it('skips an answer in words and a line that is not a tool answer', () => {
    expect(
      toToolImages({
        type: 'user',
        message: {
          content: [{ type: 'tool_result', tool_use_id: 'c', content: 'só texto' }],
        },
      }),
    ).toEqual([]);
    expect(toToolImages({ type: 'assistant', message: { content: [] } })).toEqual([]);
  });
});
