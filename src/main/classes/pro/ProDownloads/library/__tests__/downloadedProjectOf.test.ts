import { describe, expect, it } from 'vitest';
import { downloadedProjectOf } from '@/main/classes/pro/ProDownloads/library';
import { SYNCED } from './fixtures';

describe('downloadedProjectOf', () => {
  it('keeps the project under the id its first computer gave it, with its web address and repositories', () => {
    expect(downloadedProjectOf(SYNCED)).toEqual({
      projectId: 'p-1760000000000',
      name: 'Loja — staging',
      targets: [
        { id: 't-web', kind: 'web', label: 'Web', value: 'https://staging.loja.dev' },
        { id: 't-android', kind: 'android', label: 'Android', value: '' },
      ],
      repositories: [{ id: '4242', owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
    });
  });

  it('leaves out a web address that is not one, so a run never opens a file or a script', () => {
    const project = downloadedProjectOf({
      ...SYNCED,
      targets: [{ id: 't-web', kind: 'web', label: 'Web', value: 'file:///etc/hosts' }],
    });

    expect(project.targets[0]?.value).toBe('');
  });
});
