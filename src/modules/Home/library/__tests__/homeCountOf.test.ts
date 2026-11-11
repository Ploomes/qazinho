import { describe, expect, it } from 'vitest';
import { homeCountOf } from '@/modules/Home/library';

const PLAN = { workspaceId: 'w', plan: 'Cupom', project: 'Loja' };

describe('homeCountOf', () => {
  it('counts what waits on a move of the QA: a question, a run to continue, a failure', () => {
    expect(
      homeCountOf({
        asking: [{ ...PLAN, kind: 'asking', question: '?' }],
        going: [{ ...PLAN, kind: 'paused' }],
        toContinue: [{ ...PLAN, kind: 'toContinue', cases: 2 }],
        failed: [{ ...PLAN, kind: 'failed', failed: 1, bugs: 1 }],
        toDevelop: [{ ...PLAN, kind: 'toDevelop', cases: 3 }],
        recent: [],
      }),
    ).toBe(3);
  });

  it('counts nothing while every plan is at rest', () => {
    expect(
      homeCountOf({
        asking: [],
        going: [],
        toContinue: [],
        failed: [],
        toDevelop: [],
        recent: [],
      }),
    ).toBe(0);
  });
});
