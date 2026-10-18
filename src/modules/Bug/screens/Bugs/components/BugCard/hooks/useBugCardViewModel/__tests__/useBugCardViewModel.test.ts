// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useBugCardViewModel } from '@/modules/Bug/screens/Bugs/components/BugCard/hooks/useBugCardViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});
const BUG = WORKSPACE.bugs[0]!;
const PROPS = {
  bug: BUG,
  isOpen: false,
  hasRun: true,
  onToggle: vi.fn(),
  onOpenRun: vi.fn(),
  onOpenCase: vi.fn(),
};

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useBugCardViewModel', () => {
  it('says where the bug came from, so a developer can find it again', () => {
    const { result } = renderHook(() => useBugCardViewModel(PROPS));

    expect(result.current.meta.map(({ key }) => key)).toEqual([
      'run',
      'case',
      'target',
      'seen',
      'agent',
    ]);
    expect(result.current.meta[1]?.value).toBe('TC-02 · step 2');
  });

  it('writes every label and word on the card in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useBugCardViewModel(PROPS));

    expect(result.current.meta.map(({ label }) => label)).toEqual([
      'run',
      'caso',
      'alvo',
      'visto',
      'agente',
    ]);
    expect(result.current.meta[1]?.value).toBe('TC-02 · passo 2');
    expect(result.current.meta[3]?.value).toBe('uma vez');
    expect(result.current.severity).toBe('alta');
    expect(result.current.shots.map(({ label }) => label)).toEqual([
      'antes',
      'o passo que quebrou',
    ]);
  });

  it('counts the runs in a row that caught it once there is more than one', () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, bug: { ...BUG, seenRuns: 3 } }),
    );

    expect(result.current.meta[3]?.value).toBe('3 runs in a row');
  });

  it('turns the caret down once the card is open', () => {
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, isOpen: true }));

    expect(result.current.caret).toBe('▾');
  });

  it('opens the run the bug was caught in', () => {
    const onOpenRun = vi.fn();
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onOpenRun }));

    result.current.onOpenRunClick();

    expect(onOpenRun).toHaveBeenCalledWith('r-01');
    expect(result.current.hasRun).toBe(true);
  });

  it('toggles its own bug', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onToggle }));

    result.current.onHeadClick();

    expect(onToggle).toHaveBeenCalledWith('BUG-01');
  });
});
