// @vitest-environment jsdom
import type { ChangeEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMeetingModalViewModel } from '@/modules/Plan/screens/Plan/components/MeetingModal/hooks';

const VTT = [
  'WEBVTT',
  '',
  '00:00:01.000 --> 00:00:04.000',
  '<v Rui PO>Fica 5 tentativas.',
  '',
  '00:37:58.000 --> 00:38:02.000',
  '<v Lia Dev>E se for 10?',
].join('\n');

const chosen = (file: File) =>
  ({ target: { files: [file] } }) as unknown as ChangeEvent<HTMLInputElement>;
const typed = (value: string) =>
  ({ target: { value } }) as unknown as ChangeEvent<HTMLTextAreaElement>;

function render() {
  const onRead = vi.fn();
  const view = renderHook(() => useMeetingModalViewModel({ onCancel: vi.fn(), onRead }));

  return { onRead, view };
}

describe('useMeetingModalViewModel', () => {
  it('reads a VTT file the QA picked, without its times, and says how long it lasted', async () => {
    const { onRead, view } = render();

    act(() => {
      view.result.current.onFile(chosen(new File([VTT], 'alinhamento-cupons.vtt')));
    });

    await waitFor(() => {
      expect(view.result.current.file).toEqual({
        name: 'alinhamento-cupons.vtt',
        minutes: '39 min',
      });
    });
    expect(view.result.current.text).toBe(
      'Rui PO: Fica 5 tentativas.\nLia Dev: E se for 10?',
    );

    act(() => {
      view.result.current.onConfirm();
    });

    expect(onRead).toHaveBeenCalledWith({
      name: 'alinhamento-cupons.vtt',
      text: 'Rui PO: Fica 5 tentativas.\nLia Dev: E se for 10?',
    });
  });

  it('takes a pasted transcript, named as pasted', () => {
    const { onRead, view } = render();

    act(() => {
      view.result.current.onText(typed('Rui: o cupom vencido some da lista.'));
    });
    act(() => {
      view.result.current.onConfirm();
    });

    expect(onRead).toHaveBeenCalledWith({
      name: 'Pasted transcript',
      text: 'Rui: o cupom vencido some da lista.',
    });
  });

  it('names a pasted transcript by the title it opens with', () => {
    const { onRead, view } = render();

    act(() => {
      view.result.current.onText(
        typed('Alinhamento do cupom · 14/11\nRui: o cupom vencido some da lista.'),
      );
    });
    act(() => {
      view.result.current.onConfirm();
    });

    expect(onRead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alinhamento do cupom · 14/11' }),
    );
  });

  it('does NOT read an empty transcript', () => {
    const { onRead, view } = render();

    act(() => {
      view.result.current.onText(typed('   '));
    });
    act(() => {
      view.result.current.onConfirm();
    });

    expect(view.result.current.canConfirm).toBe(false);
    expect(onRead).not.toHaveBeenCalled();
  });
});
