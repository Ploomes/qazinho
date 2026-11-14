import { describe, expect, it } from 'vitest';
import { caseSourceOf } from '@/modules/Plan/library';

describe('caseSourceOf', () => {
  it('reads a criterion of the story by its number', () => {
    expect(caseSourceOf('C2')).toEqual({
      key: 'PLAN.CASE_SOURCE_CRITERION',
      number: '2',
      id: '',
    });
  });

  it('reads a Figma frame by its id', () => {
    expect(caseSourceOf('frame 12:345')).toEqual({
      key: 'PLAN.CASE_SOURCE_FRAME',
      number: '',
      id: '12:345',
    });
  });

  /** O agente escreve as fontes em inglês; a tela as mostrava cruas ("Vem de app"). */
  it('turns the page, the code, the app and the QA into words', () => {
    expect(['page', 'code', 'App', ' qa '].map((one) => caseSourceOf(one)?.key)).toEqual([
      'PLAN.CASE_SOURCE_PAGE',
      'PLAN.CASE_SOURCE_CODE',
      'PLAN.CASE_SOURCE_APP',
      'PLAN.CASE_SOURCE_QA',
    ]);
  });

  it('leaves a source it does not know as the agent wrote it', () => {
    expect(caseSourceOf('the release notes')).toBeNull();
    expect(caseSourceOf('C')).toBeNull();
  });
});
