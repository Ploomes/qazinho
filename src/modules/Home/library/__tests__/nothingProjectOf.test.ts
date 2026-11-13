import { describe, expect, it } from 'vitest';
import { nothingProjectOf } from '@/modules/Home/library';

const WORDS = { web: 'Web', explore: 'Exploração' };

describe('nothingProjectOf', () => {
  it('makes the example shop project with an exploration', () => {
    const made = nothingProjectOf({
      way: 'example',
      name: 'Loja de exemplo',
      address: 'http://127.0.0.1:47821/?lang=pt',
      text: '',
      now: 7,
      words: WORDS,
    });

    expect(made.project).toMatchObject({
      name: 'Loja de exemplo',
      targets: [{ id: 't-web', kind: 'web', value: 'http://127.0.0.1:47821/?lang=pt' }],
    });
    expect(made.workspaces[0]).toMatchObject({ name: 'Exploração', targetId: 't-web' });
    expect(made.starts).toEqual([{ kind: 'explore', workspaceId: made.openId }]);
  });

  it('makes an app that does not exist yet, its plan starting from what the QA wrote', () => {
    const made = nothingProjectOf({
      way: 'idea',
      name: 'App novo',
      address: null,
      text: ' O cupom de primeira compra ',
      now: 7,
      words: WORDS,
    });

    expect(made.project.targets).toEqual([]);
    expect(made.workspaces[0]).toMatchObject({ name: '', targetId: '' });
    expect(made.starts).toEqual([
      { kind: 'idea', workspaceId: made.openId, text: 'O cupom de primeira compra' },
    ]);
  });
});
