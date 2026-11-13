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

  it('keeps the first line as the summary and the whole thing as the detail', () => {
    expect(
      failureOf(
        new Error('\u001b[31mbrowserType.launch: Chrome is gone\u001b[39m\nmore'),
      ),
    ).toEqual({
      reason: 'other',
      said: 'browserType.launch: Chrome is gone',
      detail: 'browserType.launch: Chrome is gone\nmore',
    });
  });

  /** O stderr de um comando quebrado traz o porquê real, não só a linha "Command failed". */
  it("folds a command's stderr into the detail, under its summary", () => {
    const error = Object.assign(new Error('Command failed: axe describe-ui'), {
      stderr: 'axe: no running simulator with that udid',
    });

    expect(failureOf(error)).toEqual({
      reason: 'other',
      said: 'Command failed: axe describe-ui',
      detail: 'Command failed: axe describe-ui\naxe: no running simulator with that udid',
    });
  });

  it('reads a thrown value that is not an Error, with no detail beyond it', () => {
    expect(failureOf('the emulator went away')).toEqual({
      reason: 'other',
      said: 'the emulator went away',
      detail: null,
    });
  });
});
