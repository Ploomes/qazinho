import { describe, expect, it } from 'vitest';
import { planSignalOf } from '@/app/components/Sidebar/library';

describe('planSignalOf', () => {
  it('marks a question the agent asks', () => {
    expect(planSignalOf('attention')).toBe('asking');
  });

  it('shows a run that goes or waits paused', () => {
    expect(planSignalOf('running')).toBe('running');
    expect(planSignalOf('paused')).toBe('paused');
  });

  it('marks a plan whose last run failed', () => {
    expect(planSignalOf('failed')).toBe('failed');
  });

  /** A barra diz onde ir agora; quantos bugs há fica na tela de Bugs. */
  it('shows nothing on a plan that needs nothing from the QA', () => {
    expect(planSignalOf('passed')).toBeNull();
    expect(planSignalOf('idle')).toBeNull();
    expect(planSignalOf('stopped')).toBeNull();
  });
});
