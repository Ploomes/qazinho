import { describe, expect, it } from 'vitest';
import { projectBodyOf } from '@/main/classes/pro/ProSync/library';

describe('projectBodyOf', () => {
  it('sends the project with its variables by name and description alone', () => {
    const body = projectBodyOf({
      project: {
        projectId: 'p1',
        name: 'Loja — staging',
        targets: [
          { id: 't1', kind: 'web', label: 'staging', value: 'https://staging.loja.dev' },
        ],
        repositories: [
          { id: '4242', owner: 'loja', name: 'loja-web', baseBranch: 'main' },
        ],
      },
      variables: [
        { name: 'LOGIN_PASSWORD', description: 'senha do QA', value: 'secret' } as never,
      ],
    });

    expect(body).toEqual({
      name: 'Loja — staging',
      targets: [
        { id: 't1', kind: 'web', label: 'staging', value: 'https://staging.loja.dev' },
      ],
      repositories: [{ id: '4242', owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
      variables: [{ name: 'LOGIN_PASSWORD', description: 'senha do QA' }],
    });
  });
});
