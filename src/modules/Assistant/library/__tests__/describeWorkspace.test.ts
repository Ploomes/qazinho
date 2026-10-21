import { describe, expect, it } from 'vitest';
import { describeWorkspace } from '@/modules/Assistant/library';
import { CHECKOUT, LOGIN, PROJECT } from './fixtures';

describe('describeWorkspace', () => {
  it('tells the plan case by case with every step, then the runs and the bugs', () => {
    const text = describeWorkspace({ workspace: CHECKOUT, project: PROJECT });

    expect(text).toContain(
      'Workspace w1 "Checkout regression" in project p1 "Lojinha", testing on web https://loja.test.',
    );
    expect(text).toContain('Its plan has 2 cases and 6 steps:');
    expect(text).toContain('- TC-01 "Open the store and find a product" · P1 · last run');
    expect(text).toContain('  2. Search for a product → At least one result comes back');
    expect(text).toContain(
      `- r-01 on ${new Date(1_760_000_000_000).toLocaleDateString('sv-SE')} at 09:41, walked the whole plan: 5 passed, 1 failed, 0 blocked, 0 skipped`,
    );
    expect(text).toContain(
      '- BUG-01 · high · "Nothing happens on submit" · TC-01 step 2 · r-01',
    );
    expect(text).not.toContain('going on now');
  });

  it('says what is not there yet, and a target that is gone', () => {
    const text = describeWorkspace({
      workspace: { ...LOGIN, targetId: 't-gone' },
      project: PROJECT,
    });

    expect(text).toContain('testing on a target that is gone');
    expect(text).toContain('It has no plan yet: its chat writes one with the QA.');
    expect(text).toContain('No runs yet.');
    expect(text).toContain('No bugs.');
  });

  it('lists the questions its chat waits on, with their options', () => {
    const text = describeWorkspace({
      workspace: {
        ...LOGIN,
        chat: [
          {
            id: 'm-1',
            kind: 'questions',
            at: '10:00',
            questions: [
              {
                header: 'Cadastro',
                question: 'Qual cadastro o plano deve cobrir?',
                options: [
                  { label: 'Newsletter', description: '' },
                  { label: 'Criar conta', description: '' },
                ],
                isMultiSelect: false,
              },
              {
                header: 'Campos',
                question: 'Quais campos valem?',
                options: [
                  { label: 'Nome', description: '' },
                  { label: 'Senha', description: '' },
                ],
                isMultiSelect: true,
              },
            ],
            answers: null,
          },
        ],
      },
      project: PROJECT,
    });

    expect(text).toContain(
      [
        'Its chat agent asked the QA these questions, and waits on their answers in that chat, where the QA picks options or writes their own words:',
        '1. Cadastro: Qual cadastro o plano deve cobrir? Options: Newsletter · Criar conta.',
        '2. Campos: Quais campos valem? Options: Nome · Senha, any of them.',
      ].join('\n'),
    );
  });

  it('tells a run going on, and how far it walked', () => {
    const live = CHECKOUT.live ?? null;

    expect(
      describeWorkspace({
        workspace: {
          ...CHECKOUT,
          live:
            live === null
              ? null
              : { ...live, id: 'r-02', isDone: false, isRunning: true },
        },
        project: PROJECT,
      }),
    ).toContain('A run is going on now: r-02, 6 of 6 steps walked.');
  });
});
