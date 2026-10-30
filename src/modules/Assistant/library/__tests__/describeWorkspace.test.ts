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

  it('names the Figma design, the frame of each step and the bugs off it', () => {
    const [first, ...rest] = CHECKOUT.plan;
    const [bug, ...bugs] = CHECKOUT.bugs;
    const text = describeWorkspace({
      workspace: {
        ...CHECKOUT,
        design: {
          url: 'https://www.figma.com/design/AbC123/Shop?node-id=1-2',
          fileKey: 'AbC123',
          nodeId: '1:2',
          name: 'Shop',
        },
        plan: [
          {
            ...first!,
            steps: [{ ...first!.steps[0]!, frame: '12:345' }, ...first!.steps.slice(1)],
          },
          ...rest,
        ],
        bugs: [{ ...bug!, frame: '12:345' }, ...bugs],
      },
      project: PROJECT,
    });

    expect(text).toContain(
      'It is checked against the Figma design "Shop": https://www.figma.com/design/AbC123/Shop?node-id=1-2.',
    );
    expect(text).toMatch(/ {2}1\. .* \[frame 12:345\]/);
    expect(text).toContain('· r-01 · off the design, frame 12:345');
  });

  it('says which bugs the QA said are none', () => {
    const [bug, ...bugs] = CHECKOUT.bugs;
    const text = describeWorkspace({
      workspace: { ...CHECKOUT, bugs: [{ ...bug!, isDismissed: true }, ...bugs] },
      project: PROJECT,
    });

    expect(text).toContain(`- ${bug!.id} `);
    expect(text).toContain('the QA said it is no bug');
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

  /**
   * O Estagiário contou uma exploração como "andou 2 de 33 passos", mas ela não tem os
   * passos do plano: conta as telas que anotou.
   */
  it('counts the screens of an exploration going on, not the steps of the plan', () => {
    const live = CHECKOUT.live;
    const text = describeWorkspace({
      workspace: {
        ...CHECKOUT,
        live: live && {
          ...live,
          id: 'r-04',
          kind: 'explore',
          isDone: false,
          isRunning: true,
        },
      },
      project: PROJECT,
    });

    expect(text).toContain('An exploration is going on now: r-04');
    expect(text).toContain('screens noted so far');
    expect(text).not.toContain('steps walked');
  });

  it('counts only the steps of the cases a run was told to walk', () => {
    const live = CHECKOUT.live;
    const first = CHECKOUT.plan[0];
    const text = describeWorkspace({
      workspace: {
        ...CHECKOUT,
        live: live && {
          ...live,
          id: 'r-05',
          isDone: false,
          isRunning: true,
          outcomes: [],
          ...(first === undefined ? {} : { caseIds: [first.id] }),
        },
      },
      project: PROJECT,
    });

    expect(text).toContain(`0 of ${String(first?.steps.length)} steps walked.`);
  });
});
