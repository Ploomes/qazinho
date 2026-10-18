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
   * OpenAI's strict mode refused minItems and maxItems when it launched, and whether it takes
   * them now is not settled. A refused keyword fails the whole call, so the bounds stay with
   * Claude Code's schema and the corpus, and Codex gets the array without them.
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
