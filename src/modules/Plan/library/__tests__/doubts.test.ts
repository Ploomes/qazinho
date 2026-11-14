import type { ITestCase } from '@/modules/Plan/types';
import type { IPlanDoubt } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import {
  doubtsWithAnswers,
  doubtsWithSent,
  heldDoubtsOf,
  planWithoutDoubt,
  waitingDoubtsOf,
} from '@/modules/Plan/library';

const SENT = {
  url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=100',
  at: '2026-11-13T13:00:00.000Z',
};
const ANSWER = { text: 'They stack.', by: 'Rui PO', at: '2026-11-13T15:00:00.000Z' };

const doubt = (props: Partial<IPlanDoubt> & { id: string }): IPlanDoubt => ({
  question: `Question ${props.id}?`,
  sent: null,
  answer: null,
  ...props,
});

const testCase = (props: Partial<ITestCase> & { id: string }): ITestCase => ({
  title: 'A coupon',
  priority: 'P1',
  goal: '',
  preconditions: '',
  steps: [],
  lastVerdict: null,
  ...props,
});

/**
 * Uma dúvida nasce no chat sem ir a lugar nenhum, vai à história num comentário do QA, e
 * volta com a resposta do time; os casos que esperavam por ela ficam marcados até o plano
 * mudar.
 */
describe('the doubts of a plan', () => {
  describe('doubtsWithSent', () => {
    it('marks the doubts the comment carried, with the words the QA sent', () => {
      expect(
        doubtsWithSent({
          doubts: [doubt({ id: 'D1' }), doubt({ id: 'D2' })],
          sent: SENT,
          questions: [
            { id: 'D2', question: ' Which error shows for an expired coupon? ' },
          ],
        }),
      ).toEqual([
        doubt({ id: 'D1' }),
        doubt({
          id: 'D2',
          question: 'Which error shows for an expired coupon?',
          sent: SENT,
        }),
      ]);
    });

    it('keeps the question when the QA emptied it, and never sends a doubt twice', () => {
      const earlier = { ...SENT, at: '2026-11-12T10:00:00.000Z' };

      expect(
        doubtsWithSent({
          doubts: [doubt({ id: 'D1' }), doubt({ id: 'D2', sent: earlier })],
          sent: SENT,
          questions: [
            { id: 'D1', question: '  ' },
            { id: 'D2', question: 'Again?' },
          ],
        }),
      ).toEqual([doubt({ id: 'D1', sent: SENT }), doubt({ id: 'D2', sent: earlier })]);
    });
  });

  describe('doubtsWithAnswers', () => {
    it('writes what the team answered on the doubts that were sent', () => {
      expect(
        doubtsWithAnswers({
          doubts: [doubt({ id: 'D1', sent: SENT }), doubt({ id: 'D2', sent: SENT })],
          answers: [{ doubtId: 'D2', ...ANSWER }],
        }),
      ).toEqual([
        doubt({ id: 'D1', sent: SENT }),
        doubt({ id: 'D2', sent: SENT, answer: ANSWER }),
      ]);
    });

    it('does NOT answer a doubt never sent, nor change one already answered', () => {
      const first = { ...ANSWER, text: 'Yes.' };

      expect(
        doubtsWithAnswers({
          doubts: [doubt({ id: 'D1' }), doubt({ id: 'D2', sent: SENT, answer: first })],
          answers: [
            { doubtId: 'D1', ...ANSWER },
            { doubtId: 'D2', ...ANSWER },
          ],
        }),
      ).toEqual([doubt({ id: 'D1' }), doubt({ id: 'D2', sent: SENT, answer: first })]);
    });

    /** A leitura de uma mudança acha a resposta mesmo de uma dúvida que foi no comentário do plano. */
    it('answers any doubt when the reader of a change says so, sent or not', () => {
      expect(
        doubtsWithAnswers({
          doubts: [doubt({ id: 'D1' })],
          answers: [{ doubtId: 'D1', ...ANSWER }],
          isAnyDoubt: true,
        }),
      ).toEqual([doubt({ id: 'D1', answer: ANSWER })]);
    });
  });

  describe('waitingDoubtsOf', () => {
    it('lists the doubts on the story that no one answered yet', () => {
      expect(
        waitingDoubtsOf([
          doubt({ id: 'D1' }),
          doubt({ id: 'D2', sent: SENT }),
          doubt({ id: 'D3', sent: SENT, answer: ANSWER }),
        ]),
      ).toEqual([{ id: 'D2', sent: SENT }]);
    });
  });

  describe('heldDoubtsOf', () => {
    it('names the answered doubts that still hold cases, and the cases', () => {
      expect(
        heldDoubtsOf({
          plan: [
            testCase({ id: 'TC-01', blockedBy: ['D1'] }),
            testCase({ id: 'TC-02', blockedBy: ['D1', 'D2'] }),
            testCase({ id: 'TC-03' }),
          ],
          doubts: [
            doubt({ id: 'D1', sent: SENT, answer: ANSWER }),
            doubt({ id: 'D2', sent: SENT }),
          ],
        }),
      ).toEqual([{ id: 'D1', caseIds: ['TC-01', 'TC-02'] }]);
    });

    it('says nothing once the plan no longer waits for the answer', () => {
      expect(
        heldDoubtsOf({
          plan: [testCase({ id: 'TC-01' })],
          doubts: [doubt({ id: 'D1', sent: SENT, answer: ANSWER })],
        }),
      ).toEqual([]);
    });
  });

  describe('planWithoutDoubt', () => {
    it('lets go of a doubt the QA dropped, in every case that waited for it', () => {
      const kept = testCase({ id: 'TC-03' });

      expect(
        planWithoutDoubt({
          plan: [
            testCase({ id: 'TC-01', blockedBy: ['D1'] }),
            testCase({ id: 'TC-02', blockedBy: ['D1', 'D2'] }),
            kept,
          ],
          id: 'D1',
        }),
      ).toEqual([
        testCase({ id: 'TC-01', blockedBy: [] }),
        testCase({ id: 'TC-02', blockedBy: ['D2'] }),
        kept,
      ]);
    });
  });
});
