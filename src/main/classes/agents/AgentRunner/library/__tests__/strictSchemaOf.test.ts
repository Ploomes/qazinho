import { describe, expect, it } from 'vitest';
import { strictSchemaOf } from '@/main/classes/agents/AgentRunner/library';

describe('strictSchemaOf', () => {
  it('requires every field, and lets the optional ones be null', () => {
    expect(
      strictSchemaOf({
        type: 'object',
        properties: {
          reply: { type: 'string' },
          plan: { type: 'object', properties: {} },
        },
        required: ['reply'],
      }),
    ).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['reply', 'plan'],
      properties: {
        reply: { type: 'string' },
        plan: {
          anyOf: [
            { type: 'object', properties: {}, required: [], additionalProperties: false },
            { type: 'null' },
          ],
        },
      },
    });
  });

  it('reaches into the items of an array', () => {
    const strict = strictSchemaOf({
      type: 'array',
      items: { type: 'object', properties: { a: { type: 'string' } } },
    });

    expect(strict.items).toMatchObject({ required: ['a'], additionalProperties: false });
  });

  /**
   * O strict mode da OpenAI recusou minItems e maxItems quando foi lançado, e se ele os
   * aceita agora não está resolvido. Uma keyword recusada falha a chamada inteira, então
   * os limites ficam com o schema do Claude Code e o corpus, e o Codex recebe o array sem
   * eles.
   */
  it('drops the bounds of an array, which strict mode may refuse', () => {
    const strict = strictSchemaOf({
      type: 'object',
      properties: {
        options: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'string' } },
      },
      required: ['options'],
    });

    expect(strict.properties).toEqual({
      options: { type: 'array', items: { type: 'string' } },
    });
  });
});
