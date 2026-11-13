// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplateChoiceViewModel } from '@/modules/Project/components/ProjectModal/components/TemplateChoice/hooks';
import { useTemplateStore } from '@/store';

const BUG = {
  id: 't-bug',
  kind: 'bug' as const,
  name: 'Bug do time',
  title: '',
  parts: [],
  cases: 'steps' as const,
  updatedAt: '',
};

beforeEach(() => {
  useTemplateStore.setState({ templates: [BUG] });
});

describe('useTemplateChoiceViewModel', () => {
  it('offers QAzinho’s way and the team’s templates of each kind, the chosen one on', () => {
    const { result } = renderHook(() =>
      useTemplateChoiceViewModel({ chosen: { bug: 't-bug' }, onChange: vi.fn() }),
    );
    const [bug, plan] = result.current.kinds;

    expect(bug?.options.map(({ label, isOn }) => [label, isOn])).toEqual([
      ['QAzinho’s way', false],
      ['Bug do time', true],
    ]);
    expect(plan?.options.map(({ label, isOn }) => [label, isOn])).toEqual([
      ['QAzinho’s way', true],
    ]);
  });

  it('keeps the choice, and lets go of it for QAzinho’s way', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTemplateChoiceViewModel({ chosen: { bug: 't-bug', plan: 't-plan' }, onChange }),
    );

    act(() => {
      result.current.kinds[0]?.options[0]?.onPick();
    });

    expect(onChange).toHaveBeenLastCalledWith({ plan: 't-plan' });

    act(() => {
      result.current.kinds[0]?.options[1]?.onPick();
    });

    expect(onChange).toHaveBeenLastCalledWith({ bug: 't-bug', plan: 't-plan' });
  });

  it('shows QAzinho’s way on when the chosen template is gone', () => {
    const { result } = renderHook(() =>
      useTemplateChoiceViewModel({ chosen: { bug: 't-gone' }, onChange: vi.fn() }),
    );

    expect(result.current.kinds[0]?.options[0]?.isOn).toBe(true);
  });
});
