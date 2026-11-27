import { describe, expect, it } from 'vitest';
import { updateFeedOf } from '@/main/classes/setup/AppUpdater/library';

describe('updateFeedOf', () => {
  // Sem nada, o app segue o que o build gravou: tornar o repositório público não pede um build novo.
  it('leaves the feed the build wrote when nothing is set', () => {
    expect(updateFeedOf({ feedUrl: undefined, token: undefined })).toBeNull();
    expect(updateFeedOf({ feedUrl: '', token: '' })).toBeNull();
  });

  it('reads a private repository with a token', () => {
    expect(updateFeedOf({ feedUrl: undefined, token: 'gho_x' })).toEqual({
      provider: 'github',
      owner: 'Ploomes',
      repo: 'qazinho',
      private: true,
      token: 'gho_x',
    });
  });

  it('prefers an address it was pointed at', () => {
    expect(updateFeedOf({ feedUrl: 'http://127.0.0.1:9', token: 'gho_x' })).toEqual({
      provider: 'generic',
      url: 'http://127.0.0.1:9',
    });
  });
});
