import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import { CHAT_COMMANDS } from '@/modules/Chat/screens/Chat/constants';

describe('CHAT_COMMANDS', () => {
  it('names every command and what it does, in both languages', () => {
    for (const command of CHAT_COMMANDS)
      for (const key of [command.labelKey, command.textKey]) {
        const name = key.replace('COMMANDS.', '') as keyof typeof en.COMMANDS;

        expect(en.COMMANDS[name]).toBeTruthy();
        expect(pt.COMMANDS[name]).toBeTruthy();
      }
  });

  it('gives each command a slug of its own, starting with a slash', () => {
    const slugs = CHAT_COMMANDS.map(({ slug }) => slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => slug.startsWith('/'))).toBe(true);
  });
});
