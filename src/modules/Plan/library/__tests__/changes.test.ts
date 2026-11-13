import type { IChangeReview, IPendingChange, ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import {
  changeBriefOf,
  planWithItem,
  reviewOf,
  storyNoteOf,
} from '@/modules/Plan/library';

const CASE: ITestCase = {
  id: 'TC-04',
  title: 'Cupom inválido bloqueia',
  priority: 'P1',
  goal: '',
  preconditions: 'Um pedido no checkout',
  steps: [{ action: 'Errar o cupom 3 vezes', expected: 'Tente de novo mais tarde' }],
  lastVerdict: 'passed',
  sources: ['C3'],
};

const AFTER = {
  title: 'Cupom inválido bloqueia',
  priority: 'P1' as const,
  goal: '',
  preconditions: 'Um pedido no checkout',
  steps: [{ action: 'Errar o cupom 5 vezes', expected: 'Tente de novo mais tarde' }],
  sources: ['C3'],
};

const READ = {
  summary: 'O critério 3 passou de 3 para 5 tentativas.',
  changes: [{ caseId: 'TC-04', why: 'C3 diz 5', case: AFTER }],
  added: [
    {
      why: 'C4 é novo',
      case: {
        ...AFTER,
        title: 'Aviso depois de 4 erros',
        steps: [{ action: 'Errar 4 vezes', expected: 'Resta 1 tentativa' }],
      },
    },
  ],
  doubts: ['O bloqueio dura quanto?'],
  answered: [],
};

/**
 * Uma mudança vira trocas que o QA decide uma a uma: aplicar muda o caso e mantém o id,
 * um caso novo pega o próximo id, e a decisão volta à história num comentário.
 */
describe('the review of a change', () => {
  describe('reviewOf', () => {
    it('opens each proposed swap for the QA, numbered', () => {
      expect(reviewOf({ read: READ, at: '2026-11-13T15:00:00.000Z' })).toEqual({
        summary: READ.summary,
        at: '2026-11-13T15:00:00.000Z',
        items: [
          {
            id: 'R1',
            state: 'open',
            kind: 'change',
            caseId: 'TC-04',
            why: 'C3 diz 5',
            case: AFTER,
          },
          {
            id: 'R2',
            state: 'open',
            kind: 'add',
            why: 'C4 é novo',
            case: READ.added[0]?.case,
          },
          { id: 'R3', state: 'open', kind: 'doubt', question: 'O bloqueio dura quanto?' },
        ],
      });
    });
  });

  describe('planWithItem', () => {
    const review = reviewOf({ read: READ, at: '' });

    it('rewrites a touched case as it reads now, keeping its id and that it is by hand', () => {
      const [item] = review.items;
      const plan = planWithItem({
        plan: [{ ...CASE, isManual: true }],
        item: item!,
        used: [],
      });

      expect(plan).toEqual([
        {
          id: 'TC-04',
          title: 'Cupom inválido bloqueia',
          priority: 'P1',
          goal: '',
          preconditions: 'Um pedido no checkout',
          steps: [
            { action: 'Errar o cupom 5 vezes', expected: 'Tente de novo mais tarde' },
          ],
          lastVerdict: null,
          isManual: true,
          sources: ['C3'],
        },
      ]);
    });

    it('adds a new case at the end with an id no run or bug used', () => {
      const plan = planWithItem({
        plan: [CASE],
        item: review.items[1]!,
        used: ['TC-05'],
      });

      expect(plan.map(({ id, title }) => `${id} ${title}`)).toEqual([
        'TC-04 Cupom inválido bloqueia',
        'TC-06 Aviso depois de 4 erros',
      ]);
    });

    it('leaves the plan as it is for a doubt', () => {
      const plan = [CASE];

      expect(planWithItem({ plan, item: review.items[2]!, used: [] })).toBe(plan);
    });
  });

  describe('changeBriefOf', () => {
    it('gives the reader what changed, every case with its sources, and the doubts', () => {
      const changed: IPendingChange = {
        found: [
          {
            kind: 'story',
            key: 'SHOP-878',
            url: 'https://shop.atlassian.net/browse/SHOP-878',
            at: '2026-11-13T15:00:00.000Z',
            before: '3',
            after: '5',
            comments: [],
          },
        ],
        snapshots: [],
        code: null,
        at: '2026-11-13T15:00:00.000Z',
      };

      expect(
        changeBriefOf({ changed, plan: [CASE], doubts: [], language: 'pt' }),
      ).toEqual({
        changes: changed.found,
        cases: [
          {
            id: 'TC-04',
            title: 'Cupom inválido bloqueia',
            priority: 'P1',
            goal: '',
            preconditions: 'Um pedido no checkout',
            steps: [
              { action: 'Errar o cupom 3 vezes', expected: 'Tente de novo mais tarde' },
            ],
            sources: ['C3'],
          },
        ],
        doubts: [],
        language: 'pt',
      });
    });
  });

  describe('storyNoteOf', () => {
    it('tells the story what the plan took, one line each, and nothing it refused', () => {
      const review: IChangeReview = {
        ...reviewOf({ read: READ, at: '' }),
      };
      const decided = {
        ...review,
        items: review.items.map((item, index) => ({
          ...item,
          state: index === 1 ? ('refused' as const) : ('applied' as const),
        })),
      };

      expect(
        storyNoteOf({
          review: decided,
          plan: [CASE],
          words: {
            intro: (summary) => `Plano atualizado: ${summary}`,
            changed: ({ id, title, why }) => `${id} ${title}: ${why}`,
            added: (title) => `Novo caso: ${title}`,
            doubt: (question) => `Dúvida: ${question}`,
          },
        }),
      ).toBe(
        [
          'Plano atualizado: O critério 3 passou de 3 para 5 tentativas.',
          '- TC-04 Cupom inválido bloqueia: C3 diz 5',
          '- Dúvida: O bloqueio dura quanto?',
        ].join('\n'),
      );
    });
  });
});
