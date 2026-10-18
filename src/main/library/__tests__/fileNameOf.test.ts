import { describe, expect, it } from 'vitest';
import { fileNameOf } from '@/main/library';

describe('fileNameOf', () => {
  it('keeps a label the QA reads as it is', () => {
    expect(fileNameOf('BUG-01 · step 1 · the step that broke')).toBe(
      'BUG-01 · step 1 · the step that broke',
    );
  });

  it('turns what no file system takes into spaces, and never leaves a path', () => {
    expect(fileNameOf('r-01 / step 3: "pay" <now>?')).toBe('r-01 step 3 pay now');
    expect(fileNameOf('../../etc/passwd')).toBe('qazinho .. .. etc passwd');
    expect(fileNameOf('step\u0007 1\nbroke')).toBe('step 1 broke');
  });

  it('never gives an empty or hidden name', () => {
    expect(fileNameOf('  /  ')).toBe('qazinho');
    expect(fileNameOf('.hidden')).toBe('qazinho .hidden');
  });

  it('keeps a long label to a length every file system takes', () => {
    expect(fileNameOf('a'.repeat(300))).toHaveLength(120);
  });
});
