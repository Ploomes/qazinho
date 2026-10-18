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
});
