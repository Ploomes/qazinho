import { describe, expect, it } from 'vitest';
import { transcriptOf } from '@/modules/Plan/library';

describe('transcriptOf', () => {
  it('reads what was said in a VTT, with who said it, and how long it lasted', () => {
    expect(
      transcriptOf(
        [
          'WEBVTT',
          '',
          'NOTE exported by the meeting tool',
          'and its version',
          '',
          '1',
          '00:00:01.000 --> 00:00:04.500',
          '<v Rui PO>Fica 5 tentativas.',
          '',
          '2',
          '00:37:58.000 --> 00:38:02.000',
          '<v Lia Dev>E se for 10?</v>',
        ].join('\n'),
      ),
    ).toEqual({ text: 'Rui PO: Fica 5 tentativas.\nLia Dev: E se for 10?', minutes: 39 });
  });

  it('reads an SRT, without its numbers, and drops a line repeated across cues', () => {
    expect(
      transcriptOf(
        [
          '1',
          '00:00:01,000 --> 00:00:03,000',
          'O cupom vencido some da lista.',
          '',
          '2',
          '00:00:03,000 --> 00:00:05,000',
          'O cupom vencido some da lista.',
          '',
          '3',
          '00:01:10,000 --> 00:01:12,000',
          'Combinado.',
        ].join('\r\n'),
      ),
    ).toEqual({ text: 'O cupom vencido some da lista.\nCombinado.', minutes: 2 });
  });

  it('keeps a text or Markdown transcript as it is, with no duration', () => {
    expect(transcriptOf('# Alinhamento\n\nRui: fica 5.\n')).toEqual({
      text: '# Alinhamento\nRui: fica 5.',
      minutes: null,
    });
  });
});
