// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useQuestionRoom } from '@/modules/Assistant/hooks/useQuestionRoom';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAssistantStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAssistantStore.setState({ isOpen: true });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

describe('useQuestionRoom', () => {
  /**
   * O cartão da pergunta ficou atrás do chat do Estagiário, e o QA perdeu um minuto de
   * espera sem vê-lo.
   */
  it('closes the assistant when a run asks the QA, so the question is not covered', () => {
    renderHook(() => {
      useQuestionRoom();
    });

    expect(useAssistantStore.getState().isOpen).toBe(true);

    act(() => {
      const walking = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...walking,
            live: walking.live && {
              ...walking.live,
              isDone: false,
              question: {
                id: 'q-1',
                question: 'Which code?',
                options: [],
                isSecret: false,
                secret: { name: 'CODE', description: 'The code' },
                caseId: 'TC-01',
                stepNumber: 1,
                action: 'Pay',
                askedAtMs: 0,
                waitsUntilMs: 900_000,
                waitedSec: 0,
              },
            },
          },
        ],
      });
    });

    expect(useAssistantStore.getState().isOpen).toBe(false);
  });

  it('leaves the assistant open when no run asks anything', () => {
    renderHook(() => {
      useQuestionRoom();
    });

    expect(useAssistantStore.getState().isOpen).toBe(true);
  });
});
