// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePlanStagesViewModel } from '@/modules/Plan/screens/Plan/components/PlanStages/hooks/usePlanStagesViewModel';

const stages = (props: Parameters<typeof usePlanStagesViewModel>[0]) =>
  renderHook(() => usePlanStagesViewModel(props)).result.current.stages.map(
    ({ state, label }) => [state, label],
  );

describe('usePlanStagesViewModel', () => {
  it('asks for the development of a plan nothing was recorded for', () => {
    expect(stages({ total: 10, developed: 0, how: null })).toEqual([
      ['done', 'Plan written'],
      ['next', 'Develop'],
      ['later', 'Run'],
    ]);
  });

  it('counts what is developed so far', () => {
    expect(stages({ total: 10, developed: 3, how: null })[1]).toEqual([
      'next',
      'Developed 3 of 10',
    ]);
  });

  it('shows the development going on while the agent records', () => {
    expect(stages({ total: 10, developed: 3, how: 'develop' })[1]).toEqual([
      'live',
      'Developing 3 of 10',
    ]);
  });

  it('opens the last stage once every case is recorded', () => {
    expect(stages({ total: 4, developed: 4, how: null })).toEqual([
      ['done', 'Plan written'],
      ['done', 'Developed'],
      ['next', 'Run'],
    ]);
  });

  it('shows the recording walking, and the agent adjusting it, as the last stage', () => {
    expect(stages({ total: 4, developed: 4, how: 'replay' })[2]).toEqual([
      'live',
      'Running',
    ]);
    expect(stages({ total: 4, developed: 4, how: 'adjust' })[2]?.[0]).toBe('live');
  });
});
