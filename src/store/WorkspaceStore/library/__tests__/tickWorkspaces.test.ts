import { describe, expect, it } from 'vitest';
import { landAsked, startRun } from '@/modules/Workspace';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { tickWorkspaces } from '@/store/WorkspaceStore/library';

const IDLE = makeWorkspace();
const RUNNING = startRun({
  workspace: { ...makeWorkspace(), id: 'w2' },
  startedAt: '09:41',
  runId: 'r-01',
  by: WALKED_BY,
});

describe('tickWorkspaces', () => {
  it('moves the clock of the run that is going, and leaves the rest as they were', () => {
    const ticked = tickWorkspaces({ workspaces: [IDLE, RUNNING], seconds: 1 });

    expect(ticked[0]).toBe(IDLE);
    expect(ticked[1]?.live?.elapsedSec).toBe(1);
  });

  /**
   * O relógio tica a cada segundo haja run ou não. Uma lista nova a cada tique fazia toda
   * tela que lê os workspaces renderizar de novo, todo segundo, sem nada rodando.
   */
  it('hands back the very same list while no run is going', () => {
    const workspaces = [IDLE, { ...makeWorkspace(), id: 'w3' }];

    expect(tickWorkspaces({ workspaces, seconds: 1 })).toBe(workspaces);
  });

  /**
   * O relógio da run diz quanto tempo o dispositivo foi trabalhado; os minutos do QA vão
   * para a pergunta.
   */
  it('counts how long a question waits, and stops the run clock meanwhile', () => {
    const asking = landAsked({ workspace: RUNNING, question: QUESTION });
    const ticked = tickWorkspaces({ workspaces: [asking], seconds: 1 })[0];

    expect(ticked?.live?.question?.waitedSec).toBe(1);
    expect(ticked?.live?.elapsedSec).toBe(0);
  });

  it('counts the wait on a question even while the run is paused', () => {
    const asking = landAsked({ workspace: RUNNING, question: QUESTION });
    const paused = {
      ...asking,
      live: asking.live && { ...asking.live, isRunning: false },
    };

    expect(
      tickWorkspaces({ workspaces: [paused], seconds: 1 })[0]?.live?.question?.waitedSec,
    ).toBe(1);
  });
});
