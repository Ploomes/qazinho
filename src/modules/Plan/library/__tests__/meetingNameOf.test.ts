import { describe, expect, it } from 'vitest';
import { meetingNameOf } from '@/modules/Plan/library';

describe('meetingNameOf', () => {
  /** No teste de usabilidade, o comentário dizia "Decidido na reunião “Transcrição colada”". */
  it('names a pasted meeting by its first line', () => {
    expect(
      meetingNameOf({
        text: '\n  Alinhamento do cupom · 14/11\nMarina (PO): Pessoal...',
        fallback: 'Transcrição colada',
      }),
    ).toBe('Alinhamento do cupom · 14/11');
  });

  it('keeps the fallback when the first line is a long sentence, or there is none', () => {
    expect(
      meetingNameOf({
        text: 'Marina (PO): Pessoal, quero fechar as pendências do cupom antes da sprint acabar.',
        fallback: 'Transcrição colada',
      }),
    ).toBe('Transcrição colada');
    expect(meetingNameOf({ text: '  \n ', fallback: 'Transcrição colada' })).toBe(
      'Transcrição colada',
    );
  });

  it('does NOT take a line someone said as the name', () => {
    expect(
      meetingNameOf({
        text: 'Rui: o cupom vencido some.',
        fallback: 'Transcrição colada',
      }),
    ).toBe('Transcrição colada');
  });
});
