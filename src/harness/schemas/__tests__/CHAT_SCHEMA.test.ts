import { describe, expect, it } from 'vitest';
import { CHAT_SCHEMA } from '@/harness/schemas';

describe('CHAT_SCHEMA', () => {
  it('asks for a reply, and lets the plan be left out', () => {
    const schema = JSON.parse(CHAT_SCHEMA) as { required: string[]; properties: object };

    expect(schema.required).toEqual(['reply']);
    expect(Object.keys(schema.properties)).toEqual(['reply', 'plan']);
  });

  /**
   * Claude Code drops a --json-schema that carries "$schema" without a word: it stops offering
   * the StructuredOutput tool, and the agent answers in prose. z.toJSONSchema writes it, so it
   * has to be taken out.
   */
  it('carries no "$schema", which makes the CLI ignore the schema', () => {
    expect(JSON.parse(CHAT_SCHEMA)).not.toHaveProperty('$schema');
  });

  it('refuses fields the answer never asked for, so the agent cannot drift', () => {
    expect(JSON.parse(CHAT_SCHEMA)).toMatchObject({ additionalProperties: false });
  });
});
