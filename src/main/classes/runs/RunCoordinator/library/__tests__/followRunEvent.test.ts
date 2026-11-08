import type { IRunAsked, IRunInFlight, IRunQuestion, IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { followRunEvent } from '@/main/classes/runs/RunCoordinator/library';

const RUN: IRunInFlight = {
  workspaceId: 'w1',
  runId: 'r-01',
  startedAtMs: 0,
  doingIndex: -1,
  streamUrl: null,
  address: null,
  outcomes: [],
  isPaused: false,
  costUsd: null,
  findings: [],
  agentId: 'claude-code',
  model: 'haiku',
  targetKind: 'web',
  isExploring: false,
  question: null,
  asked: [],
};

const OUTCOME = { workspaceId: 'w1', index: 0, verdict: 'passed' } as IStepOutcome;

describe('followRunEvent', () => {
  it('moves to the step the agent is on', () => {
    expect(
      followRunEvent({
        run: RUN,
        event: { kind: 'doing', workspaceId: 'w1', index: 3, how: 'develop' },
      }),
    ).toMatchObject({ doingIndex: 3, how: 'develop' });
  });

  it('keeps the stream address, so a page that opens later can watch', () => {
    expect(
      followRunEvent({
        run: RUN,
        event: { kind: 'streaming', workspaceId: 'w1', url: 'http://x' },
      }).streamUrl,
    ).toBe('http://x');
  });

  it('keeps the address the tab is on, so a page that opens later shows it', () => {
    expect(
      followRunEvent({
        run: RUN,
        event: {
          kind: 'address',
          workspaceId: 'w1',
          url: 'http://localhost:8000/templates',
        },
      }).address,
    ).toBe('http://localhost:8000/templates');
  });

  it('keeps every verdict, and is on no step until the next one starts', () => {
    const doing = { ...RUN, doingIndex: 0 };
    const after = followRunEvent({
      run: doing,
      event: { kind: 'step', outcome: OUTCOME },
    });

    expect(after.outcomes).toEqual([OUTCOME]);
    expect(after.doingIndex).toBe(-1);
  });

  it('does NOT change for a note, which only the chat keeps', () => {
    expect(
      followRunEvent({
        run: RUN,
        event: { kind: 'note', workspaceId: 'w1', text: 'hi' },
      }),
    ).toBe(RUN);
  });

  it('adds up what each case cost, so a page that opens later shows the run so far', () => {
    const once = followRunEvent({
      run: RUN,
      event: { kind: 'cost', workspaceId: 'w1', costUsd: 0.02 },
    });

    expect(once.costUsd).toBe(0.02);
    expect(
      followRunEvent({
        run: once,
        event: { kind: 'cost', workspaceId: 'w1', costUsd: 0.03 },
      }).costUsd,
    ).toBeCloseTo(0.05);
  });

  it('keeps every bug filed on the side of a step, for a page that opens later', () => {
    const finding = {
      caseId: 'TC-01',
      stepNumber: 2,
      index: 1,
      action: 'Open Premium',
      title: 'Yearly price differs',
      severity: 'medium' as const,
      expected: 'One price',
      got: '$20.49 and $20.40',
      at: 1_760_000_000_000,
      screenshot: null,
      shotFile: null,
    };

    expect(
      followRunEvent({ run: RUN, event: { kind: 'finding', workspaceId: 'w1', finding } })
        .findings,
    ).toEqual([finding]);
  });

  describe('a question to the QA', () => {
    const QUESTION: IRunQuestion = {
      id: 'q-1',
      question: 'Which plan?',
      options: ['Premium', 'Premium+'],
      isSecret: false,
      secret: { name: 'QA_ANSWER_1', description: 'Which plan?' },
      caseId: 'TC-01',
      stepNumber: 2,
      action: 'Pick a plan',
      askedAtMs: 1_000,
      waitsUntilMs: 901_000,
    };
    const ASKED: IRunAsked = {
      id: 'q-1',
      question: 'Which plan?',
      caseId: 'TC-01',
      stepNumber: 2,
      answer: { kind: 'said', text: 'Premium+' },
      askedAtMs: 1_000,
      answeredAtMs: 31_000,
    };

    it('keeps the question the agent waits on, for a page that opens later', () => {
      expect(
        followRunEvent({
          run: RUN,
          event: { kind: 'asked', workspaceId: 'w1', question: QUESTION },
        }).question,
      ).toEqual(QUESTION);
    });

    it('lets the question go once answered, and keeps how it was answered', () => {
      const answered = followRunEvent({
        run: { ...RUN, question: QUESTION },
        event: { kind: 'answered', workspaceId: 'w1', asked: ASKED },
      });

      expect(answered.question).toBeNull();
      expect(answered.asked).toEqual([ASKED]);
    });

    it('does NOT let go of a newer question for the answer to an older one', () => {
      const newer = { ...QUESTION, id: 'q-2' };

      expect(
        followRunEvent({
          run: { ...RUN, question: newer },
          event: { kind: 'answered', workspaceId: 'w1', asked: ASKED },
        }).question,
      ).toEqual(newer);
    });
  });
});
