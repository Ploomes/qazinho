import { describe, expect, it } from 'vitest';
import { findElement } from '@/main/classes/devices/IosDriver/library';

const ELEMENTS = [
  { label: 'Sign in with Apple', role: 'Button', x: 10, y: 10 },
  { label: 'Sign in', role: 'Button', x: 20, y: 20 },
  { label: '', role: 'Other', x: 30, y: 30 },
];

describe('findElement', () => {
  it('prefers the whole label over one that merely contains it', () => {
    expect(findElement({ elements: ELEMENTS, target: 'Sign in' })?.x).toBe(20);
  });

  it('takes part of a label, because the agent shortens what it saw', () => {
    expect(findElement({ elements: ELEMENTS, target: 'with Apple' })?.x).toBe(10);
  });

  it('does not care about case', () => {
    expect(findElement({ elements: ELEMENTS, target: 'SIGN IN' })?.x).toBe(20);
  });

  it('never matches an element with nothing written on it', () => {
    expect(findElement({ elements: ELEMENTS, target: '' })).toBeNull();
  });

  it('nothing on the screen answering is null, not the first element', () => {
    expect(findElement({ elements: ELEMENTS, target: 'Register' })).toBeNull();
  });
});
