import { describe, expect, it } from 'vitest';
import { deviceKeyOf } from '@/modules/Device/library';

describe('deviceKeyOf', () => {
  it('presses the keys a device has', () => {
    expect(deviceKeyOf('Enter')).toBe('Enter');
    expect(deviceKeyOf('Backspace')).toBe('Backspace');
    expect(deviceKeyOf('ArrowDown')).toBe('ArrowDown');
  });

  it('leaves letters to typing, and the keys no device has alone', () => {
    expect(deviceKeyOf('a')).toBeNull();
    expect(deviceKeyOf('Shift')).toBeNull();
    expect(deviceKeyOf('F5')).toBeNull();
  });
});
