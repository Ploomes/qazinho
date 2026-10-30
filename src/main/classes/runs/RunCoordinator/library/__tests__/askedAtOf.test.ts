import { describe, expect, it } from 'vitest';
import { askedAtOf } from '@/main/classes/runs/RunCoordinator/library';

const AT = { caseId: 'exploration', stepNumber: 1, action: 'Entrar' };

describe('askedAtOf', () => {
  /**
   * O cabeçalho da pergunta dizia "Entrar", a última tela anotada, e a pergunta era do
   * Carrinho.
   */
  it('names the screen the explorer says it is on, over the last one it noted', () => {
    expect(askedAtOf({ at: AT, screen: 'Carrinho', isExploring: true })).toEqual({
      ...AT,
      action: 'Carrinho',
    });
  });

  it('keeps the last screen noted when the explorer names none', () => {
    expect(askedAtOf({ at: AT, screen: null, isExploring: true })).toEqual(AT);
  });

  it('does NOT replace the step of a case, which the plan already names', () => {
    expect(askedAtOf({ at: AT, screen: 'Carrinho', isExploring: false })).toEqual(AT);
  });
});
