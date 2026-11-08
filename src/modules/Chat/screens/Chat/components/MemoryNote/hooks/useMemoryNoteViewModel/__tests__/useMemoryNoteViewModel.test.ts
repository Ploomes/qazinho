// @vitest-environment jsdom
import type { IMemoryMessage } from '@/modules/Chat/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMemoryNoteViewModel } from '@/modules/Chat/screens/Chat/components/MemoryNote/hooks/useMemoryNoteViewModel';

const linesOf = (changes: IMemoryMessage['changes']) =>
  renderHook(() =>
    useMemoryNoteViewModel({
      message: { id: 'm-1', kind: 'memory', at: '10:30', changes },
    }),
  ).result.current.lines.map(({ text }) => text);

describe('useMemoryNoteViewModel', () => {
  it('says what it noted, what it corrected and what it forgot', () => {
    expect(
      linesOf([
        { kind: 'added', text: 'O SSO não funciona.' },
        { kind: 'replaced', text: 'Fica em Relatórios.' },
        { kind: 'forgotten', text: 'Fica em Ajustes.' },
      ]),
    ).toEqual([
      'Noted: O SSO não funciona.',
      'Updated: Fica em Relatórios.',
      'Forgot: Fica em Ajustes.',
    ]);
  });

  it('keeps the words of the memory as they are, marks and all', () => {
    expect(linesOf([{ kind: 'added', text: 'Vai por <Ajustes> & "Avançado"' }])).toEqual([
      'Noted: Vai por <Ajustes> & "Avançado"',
    ]);
  });
});
