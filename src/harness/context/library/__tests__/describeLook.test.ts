import { describe, expect, it } from 'vitest';
import { describeLook } from '@/harness/context/library';

describe('describeLook', () => {
  it('hands the agent what the page read, line by line', () => {
    expect(
      describeLook({
        url: 'https://rotuz.test/',
        isOpen: true,
        page: 'TITLE: Rotuz\nTEXT:\nThe score of what you eat',
      }).lines,
    ).toEqual([
      'QAzinho opened https://rotuz.test/ in a browser before this message. Its page reads:',
      'TITLE: Rotuz',
      'TEXT:',
      'The score of what you eat',
    ]);
  });

  it('says why the page did not open, so the agent asks instead of guessing', () => {
    expect(
      describeLook({
        url: 'https://down.test/',
        isOpen: false,
        reason: 'net::ERR_NAME_NOT_RESOLVED',
      }).lines,
    ).toEqual([
      'QAzinho tried to open https://down.test/ before this message and could not: net::ERR_NAME_NOT_RESOLVED',
    ]);
  });

  it('adds nothing when QAzinho did not look', () => {
    expect(describeLook(null).lines).toEqual([]);
  });
});
