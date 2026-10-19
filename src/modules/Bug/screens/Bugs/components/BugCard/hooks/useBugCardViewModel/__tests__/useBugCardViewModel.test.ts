// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useBugCardViewModel } from '@/modules/Bug/screens/Bugs/components/BugCard/hooks/useBugCardViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useSettingsStore } from '@/store';

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

  it('names the agent and the model that caught it, not the ones picked now', () => {
    useSettingsStore.setState({ agent: 'Codex', model: '' });

    const { result } = renderHook(() =>
      useBugCardViewModel({
        ...PROPS,
        bug: { ...BUG, agent: 'Claude Code', modelName: 'Opus' },
      }),
    );

    expect(result.current.meta.find(({ key }) => key === 'agent')?.value).toBe(
      'Claude Code · Opus',
    );
  });

  it("says the agent's own default when it named no model", () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, bug: { ...BUG, modelName: null } }),
    );

    expect(result.current.meta.find(({ key }) => key === 'agent')?.value).toBe(
      'Claude Code · Agent default',
    );
  });

  it('does NOT make up who caught an older bug that never said', () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, bug: { ...BUG, agent: '', modelName: null } }),
    );

    expect(result.current.meta.map(({ key }) => key)).not.toContain('agent');
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

  it('leaves out the explanation a bug found on the side of a step never had', () => {
    expect(renderHook(() => useBugCardViewModel(PROPS)).result.current.hasBody).toBe(
      true,
    );
    expect(
      renderHook(() => useBugCardViewModel({ ...PROPS, bug: { ...BUG, body: '' } }))
        .result.current.hasBody,
    ).toBe(false);
  });
});
