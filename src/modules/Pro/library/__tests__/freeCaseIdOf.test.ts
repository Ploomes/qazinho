import { describe, expect, it } from 'vitest';
import { freeCaseIdOf } from '@/modules/Pro/library';

describe('freeCaseIdOf', () => {
  it('takes the next number no case holds, keeping its width', () => {
    expect(freeCaseIdOf({ id: 'TC-02', taken: ['TC-01', 'TC-02', 'TC-03'] })).toBe(
      'TC-04',
    );
    expect(freeCaseIdOf({ id: 'TC-09', taken: ['TC-09'] })).toBe('TC-10');
  });

  it('counts after an id with no number', () => {
    expect(freeCaseIdOf({ id: 'login', taken: ['login', 'login-2'] })).toBe('login-3');
  });
});
