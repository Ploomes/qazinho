// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRunProgressViewModel } from '@/modules/Chat/screens/Chat/components/RunProgress/hooks/useRunProgressViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
});

describe('useRunProgressViewModel', () => {
  it('says what the run walks and on which case it is', () => {
    useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

    const { result } = renderHook(() => useRunProgressViewModel());

    expect(result.current.title).toBe('Running 2 cases');
    expect(result.current.sub).toMatch(/^Case 1 of 2, .+ so far$/);
  });

  it('opens the case it walks step by step, the walked marked and the rest waiting', () => {
    const walked = walkRun({ verdicts: ['passed'] });

    /* O passo em andamento vem do evento doing da run, que o fixture não manda. */
    useWorkspaceStore.setState({
      workspaces: [
        {
          ...walked,
          live: walked.live === null ? null : { ...walked.live, doingIndex: 1 },
        },
      ],
    });

    const [now, next] = renderHook(() => useRunProgressViewModel()).result.current.cases;

    expect(now?.steps.map(({ icon }) => icon)).toEqual(['check', 'running', null]);
    expect(now?.className).toContain('run-progress__case--now');
    expect(next).toMatchObject({
      steps: [],
      className: 'run-progress__case run-progress__case--waiting',
    });
  });

  it('marks a case that failed in red, and closes it once the run moves on', () => {
    useWorkspaceStore.setState({
      workspaces: [walkRun({ verdicts: ['passed', 'passed', 'failed'] })],
    });

    const [done] = renderHook(() => useRunProgressViewModel()).result.current.cases;

    expect(done).toMatchObject({ mark: 'failed', steps: [] });
  });
});
