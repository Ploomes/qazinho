import { describe, expect, it } from 'vitest';
import { templateFailureOf } from '@/main/classes/pro/ProTemplates/library';

describe('templateFailureOf', () => {
  it('tells a signed-out account from a role that cannot', () => {
    expect(templateFailureOf(401)).toBe('signed-out');
    expect(templateFailureOf(403)).toBe('forbidden');
  });

  it('reads no answer and a server failure as no connection', () => {
    expect(templateFailureOf(0)).toBe('unreachable');
    expect(templateFailureOf(503)).toBe('unreachable');
  });

  it('reads any other refusal as a failure', () => {
    expect(templateFailureOf(404)).toBe('failed');
    expect(templateFailureOf(402)).toBe('failed');
  });
});
