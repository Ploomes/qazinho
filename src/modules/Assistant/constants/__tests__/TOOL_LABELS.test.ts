import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import {
  CONFIRM_TOOLS,
  LATEST_RUN_LABEL,
  TOOL_LABELS,
} from '@/modules/Assistant/constants';

/**
 * The table is typed over every AppToolCall but the confirmed ones, and the harness's compiler
 * holds AppToolCall to the tools' zod schemas, so a tool with no line here does not compile.
 */
describe('TOOL_LABELS', () => {
  it('gives no line to a tool the QA confirms on a card instead', () => {
    for (const action of CONFIRM_TOOLS)
      expect(Object.keys(TOOL_LABELS)).not.toContain(action);
  });

  it('says each tool while it goes and once it is done, in both languages', () => {
    for (const { doing, done } of [...Object.values(TOOL_LABELS), LATEST_RUN_LABEL])
      for (const language of ['en', 'pt'])
        for (const key of [doing, done])
          expect(i18n.exists(key, { lng: language }), `${key} in ${language}`).toBe(true);
  });
});
