// @vitest-environment jsdom
import type { IVerdictMessage } from '@/modules/Chat/types';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useVerdictNoteViewModel } from '@/modules/Chat/screens/Chat/components/VerdictNote/hooks';

const MESSAGE: IVerdictMessage = {
  id: 'm-3',
  kind: 'verdict',
  runId: 'r-01',
  at: '09:42',
  verdict: 'failed',
  stepNumber: 3,
  action: 'Apply EXPIRED10',
  expected: 'The coupon is refused',
  got: 'Coupon applied: 10% off',
};

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useVerdictNoteViewModel', () => {
  it('names the step and what it did, in the language the QA reads', async () => {
    expect(
      renderHook(() => useVerdictNoteViewModel({ message: MESSAGE })).result.current
        .title,
    ).toBe('Step 3 · Apply EXPIRED10');

    await i18n.changeLanguage('pt');

    expect(
      renderHook(() => useVerdictNoteViewModel({ message: MESSAGE })).result.current
        .title,
    ).toBe('Passo 3 · Apply EXPIRED10');
  });

  it('shows only what the step did when an old record lost its number', () => {
    const { result } = renderHook(() =>
      useVerdictNoteViewModel({ message: { ...MESSAGE, stepNumber: 0 } }),
    );

    expect(result.current.title).toBe('Apply EXPIRED10');
  });

  it('shows the expected and got only when both came back', () => {
    expect(
      renderHook(() => useVerdictNoteViewModel({ message: MESSAGE })).result.current
        .hasEvidence,
    ).toBe(true);
    expect(
      renderHook(() => useVerdictNoteViewModel({ message: { ...MESSAGE, got: null } }))
        .result.current.hasEvidence,
    ).toBe(false);
  });
});
