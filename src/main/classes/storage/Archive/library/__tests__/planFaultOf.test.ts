import { describe, expect, it } from 'vitest';
import { planFaultOf } from '@/main/classes/storage/Archive/library';

describe('planFaultOf', () => {
  it('reads a plan as QAzinho writes it', () => {
    expect(
      planFaultOf(
        'cases:\n  - id: TC-01\n    title: Login\n    steps:\n      - action: Open\n        expected: Opens\n',
      ),
    ).toBeNull();
  });

  it('reads an empty file and an empty list as an empty plan', () => {
    expect(planFaultOf('')).toBeNull();
    expect(planFaultOf('cases: []\n')).toBeNull();
    expect(planFaultOf('# nothing yet\n')).toBeNull();
  });

  /** A quote left open by hand swallows everything after it. */
  it('names the line where the YAML broke', () => {
    expect(
      planFaultOf(
        'cases:\n  - id: TC-01\n    steps:\n      - action: Open\n        expected: "opens\n  - id: TC-02\n',
      ),
    ).toEqual({ line: 7 });
  });

  it('does NOT read YAML that is not the shape of a plan', () => {
    expect(planFaultOf('- just\n- a list\n')).toEqual({ line: null });
    expect(planFaultOf('cases: Login\n')).toEqual({ line: null });
    expect(planFaultOf('cases:\n  - Login\n')).toEqual({ line: null });
    expect(planFaultOf('cases:\n  - id: TC-01\n    steps: Open\n')).toEqual({
      line: null,
    });
  });
});
