import { describe, expect, it } from 'vitest';
import { describeVariables } from '@/modules/Outside/library';

const PROJECT = { id: 'p1', name: 'Loja', targets: [], repositories: [] };

describe('describeVariables', () => {
  it('names each variable as a step writes it, with what it holds', () => {
    expect(
      describeVariables({
        project: PROJECT,
        variables: [
          { name: 'ADMIN_PASSWORD', description: 'The admin password' },
          { name: 'TOKEN', description: '' },
        ],
      }),
    ).toContain('  ${ADMIN_PASSWORD} · The admin password\n  ${TOKEN}');
  });

  it('says how to add one when the project keeps none', () => {
    expect(describeVariables({ project: PROJECT, variables: [] })).toContain(
      'ask_variables',
    );
  });
});
