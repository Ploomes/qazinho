import type { ISuiteTest } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { branchNameOf } from '@/main/classes/automation/SuiteChanges/library';

const test = (title: string): ISuiteTest => ({
  id: 't-1',
  file: 'tests/a.spec.ts',
  line: 1,
  path: [],
  title,
  tags: [],
  project: 'chromium',
});

describe('branchNameOf', () => {
  it('names the branch after the fix and the test, in plain lower case', () => {
    expect(
      branchNameOf({
        kind: 'fix',
        test: test('CT-NAV-002 · Abre o carrinho'),
        runId: 's-01',
      }),
    ).toBe('qazinho/fix-ct-nav-002-abre-o-carrinho');
  });

  it('drops the accents and marks git would refuse or a QA would not type', () => {
    expect(
      branchNameOf({
        kind: 'fix',
        test: test('Ação: "salvar" ~ versão^2'),
        runId: 's-01',
      }),
    ).toBe('qazinho/fix-acao-salvar-versao-2');
  });

  it('keeps a long title short, never ending on a dash', () => {
    const name = branchNameOf({
      kind: 'fix',
      test: test(
        'CT-HC-5096-001 · Valida que a mensagem de boas vindas aparece depois do login',
      ),
      runId: 's-01',
    });

    expect(name.length).toBeLessThanOrEqual('qazinho/'.length + 48);
    expect(name.endsWith('-')).toBe(false);
  });

  it('still names a branch for a title with no letter or digit', () => {
    expect(branchNameOf({ kind: 'fix', test: test('· · ·'), runId: 's-01' })).toBe(
      'qazinho/fix-test',
    );
  });
});
