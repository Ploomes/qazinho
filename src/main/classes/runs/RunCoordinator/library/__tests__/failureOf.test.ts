import { describe, expect, it } from 'vitest';
import { failureOf } from '@/main/classes/runs/RunCoordinator/library';

describe('failureOf', () => {
  /**
   * O chat mostrava as próprias palavras do Playwright: "page.goto: net::ERR_UNSAFE_PORT
   * … Call log: …".
   */
  it('names the page Chrome could not reach and how it failed', () => {
    expect(
      failureOf(
        new Error(
          'page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/\nCall log:\n  - navigating to "http://127.0.0.1:3000/"',
        ),
      ),
    ).toEqual({
      reason: 'unreachable',
      code: 'ERR_CONNECTION_REFUSED',
      url: 'http://127.0.0.1:3000/',
    });
  });

  it('keeps the first line of anything else, without its colours', () => {
    expect(
      failureOf(
        new Error('\u001b[31mbrowserType.launch: Chrome is gone\u001b[39m\nmore'),
      ),
    ).toEqual({
      reason: 'other',
      said: 'browserType.launch: Chrome is gone',
    });
  });

  it('reads a thrown value that is not an Error', () => {
    expect(failureOf('the emulator went away')).toEqual({
      reason: 'other',
      said: 'the emulator went away',
    });
  });
});
