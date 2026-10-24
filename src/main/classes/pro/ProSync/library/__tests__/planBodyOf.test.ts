import { describe, expect, it } from 'vitest';
import { planBodyOf } from '@/main/classes/pro/ProSync/library';

describe('planBodyOf', () => {
  it('sends the plan without the workspace id the path already carries', () => {
    const body = planBodyOf({
      workspaceId: 'w1',
      name: 'Checkout com Pix',
      targetId: 't1',
      targetKind: 'web',
      issue: null,
      design: null,
      cases: [
        {
          id: 'c1',
          title: 'Pagar com Pix',
          priority: 'P1',
          goal: 'Pagar',
          preconditions: '',
          steps: [{ action: 'Abrir', expected: 'Abre' }],
        },
      ],
    });

    expect(body).not.toHaveProperty('workspaceId');
    expect(body).toMatchObject({ name: 'Checkout com Pix', targetKind: 'web' });
  });
});
