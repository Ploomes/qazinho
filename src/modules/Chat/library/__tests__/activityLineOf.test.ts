import type { IAgentActivity } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { ACTIVITY_KEYS } from '@/modules/Chat/constants';
import { activityLineOf } from '@/modules/Chat/library';

const line = (activity: Partial<IAgentActivity>, hasDesign = false) =>
  activityLineOf({
    activity: { id: 7, tool: 'look', target: '', ...activity },
    hasDesign,
    say: (key, values) => `${key}|${values.target}`,
  });

describe('what the agent did, as the QA reads it', () => {
  it('names the thing it clicked', () => {
    expect(line({ tool: 'click', target: 'Salvar' })).toEqual({
      id: 7,
      text: 'CHAT.DOING_CLICK|Salvar',
      isBug: false,
    });
  });

  it('calls a measure a comparison when there is a design to hold it to', () => {
    expect(line({ tool: 'inspect', target: 'Título' }, true)?.text).toBe(
      'CHAT.DOING_INSPECT_DESIGN|Título',
    );
    expect(line({ tool: 'inspect', target: 'Título' }, false)?.text).toBe(
      'CHAT.DOING_INSPECT|Título',
    );
  });

  it('marks a caught bug', () => {
    expect(line({ tool: 'bug', target: 'Total errado' })?.isBug).toBe(true);
  });

  it('reads a file by its name, on any system', () => {
    expect(line({ tool: 'Read', target: '/a/b/plan.ts' })?.text).toBe(
      'CHAT.DOING_READ|plan.ts',
    );
    expect(line({ tool: 'Read', target: 'C:\\a\\b\\plan.ts' })?.text).toBe(
      'CHAT.DOING_READ|plan.ts',
    );
  });

  it('reads an address without its scheme', () => {
    expect(line({ tool: 'goto', target: 'https://shop.test/cart/' })?.text).toBe(
      'CHAT.DOING_GOTO|shop.test/cart',
    );
  });

  it('has no line for a tool it has no words for', () => {
    expect(line({ tool: 'ask_qa' })).toBeNull();
    expect(line({ tool: 'toString' })).toBeNull();
  });

  it('has a phrase in the language for every tool it knows', () => {
    for (const key of [...Object.values(ACTIVITY_KEYS), 'CHAT.DOING_INSPECT_DESIGN']) {
      const [, name = ''] = key.split('.');

      expect(en.CHAT).toHaveProperty(name);
    }
  });
});
