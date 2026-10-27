import { describe, expect, it } from 'vitest';
import { projectOfDownload } from '@/modules/Pro/library';

describe('projectOfDownload', () => {
  it('keeps the project under the id the org knows it by', () => {
    expect(
      projectOfDownload({
        projectId: 'p-1760000000000',
        name: 'Loja',
        targets: [{ id: 't-web', kind: 'web', label: 'Web', value: 'https://loja.dev' }],
        repositories: [{ id: null, owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
      }),
    ).toEqual({
      id: 'p-1760000000000',
      name: 'Loja',
      targets: [{ id: 't-web', kind: 'web', label: 'Web', value: 'https://loja.dev' }],
      repositories: [{ id: null, owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
    });
  });
});
