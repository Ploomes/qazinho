import { describe, expect, it } from 'vitest';
import { replyInPartial } from '@/main/classes/agents/AgentRunner/library';

const read = (written: string) => replyInPartial({ written, field: 'reply' });

describe('reading a reply out of JSON still being written', () => {
  it('has nothing to say before the field opens', () => {
    expect(read('')).toBe('');
    expect(read('{"re')).toBe('');
    expect(read('{"reply"')).toBe('');
    expect(read('{"reply":')).toBe('');
    expect(read('{"reply": ')).toBe('');
  });

  it('reads what has come so far, and the whole of it once closed', () => {
    expect(read('{"reply": "Testar so')).toBe('Testar so');
    expect(read('{"reply": "Testar", "questions": [')).toBe('Testar');
  });

  it('turns the escapes into what they mean', () => {
    expect(read('{"reply": "um\\ndois \\"tr\\u00eas\\" \\\\ fim')).toBe(
      'um\ndois "três" \\ fim',
    );
  });

  /** A CLI corta em qualquer lugar, inclusive no meio de um escape. */
  it('waits for the rest of an escape cut in half', () => {
    expect(read('{"reply": "linha\\')).toBe('linha');
    expect(read('{"reply": "tr\\u00')).toBe('tr');
  });

  it('finds the field even when another one comes first', () => {
    expect(read('{"questions": [{"text": "x"}], "reply": "oi')).toBe('oi');
  });

  it('is not fooled by the same word nested deeper or inside a value', () => {
    expect(read('{"plan": {"reply": "no"}, "note": "reply", "reply": "sim')).toBe('sim');
  });
});
