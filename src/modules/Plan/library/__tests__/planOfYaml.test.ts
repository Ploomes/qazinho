import { describe, expect, it } from 'vitest';
import { planOfYaml } from '@/modules/Plan/library';

describe('planOfYaml', () => {
  it('reads back a plan as QAzinho writes it', () => {
    const plan = planOfYaml(
      'cases:\n  - id: TC-01\n    title: Login\n    priority: P1\n    goal: Enters\n    preconditions: None\n    steps:\n      - action: Open\n        expected: Opens\n        frame: "1:2"\n    lastVerdict: passed\n',
    );

    expect(plan).toEqual([
      {
        id: 'TC-01',
        title: 'Login',
        priority: 'P1',
        goal: 'Enters',
        preconditions: 'None',
        steps: [{ action: 'Open', expected: 'Opens', frame: '1:2' }],
        lastVerdict: 'passed',
      },
    ]);
  });

  /** A step with no action used to crash the plan the moment it was walked. */
  it('reads a field left out by hand as empty instead of breaking the plan', () => {
    expect(
      planOfYaml('cases:\n  - id: TC-01\n    steps:\n      - expected: Opens\n'),
    ).toEqual([
      {
        id: 'TC-01',
        title: '',
        priority: 'P2',
        goal: '',
        preconditions: '',
        steps: [{ action: '', expected: 'Opens' }],
        lastVerdict: null,
      },
    ]);
  });

  it('gives a case with no id, or one taken, an id no case has', () => {
    const plan = planOfYaml(
      'cases:\n  - id: TC-01\n    title: A\n  - title: B\n  - id: TC-01\n    title: C\n',
    );

    expect(plan.map(({ id }) => id)).toEqual(['TC-01', 'TC-02', 'TC-03']);
  });

  it('does NOT keep a priority or a verdict it does not know', () => {
    const [testCase] = planOfYaml(
      'cases:\n  - id: TC-01\n    priority: urgent\n    lastVerdict: running\n',
    );

    expect(testCase).toMatchObject({ priority: 'P2', lastVerdict: null });
  });

  it('reads nonsense as no plan', () => {
    expect(planOfYaml('cases: [ nope')).toEqual([]);
    expect(planOfYaml('- a\n- b\n')).toEqual([]);
    expect(planOfYaml('')).toEqual([]);
  });
});
