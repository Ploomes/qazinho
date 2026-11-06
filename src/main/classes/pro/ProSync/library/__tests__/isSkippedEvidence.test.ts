import { describe, expect, it } from 'vitest';
import { isSkippedEvidence } from '@/main/classes/pro/ProSync/library';

describe('isSkippedEvidence', () => {
  it('leaves out a file the org has no room for, or one the platform does not keep', () => {
    expect(isSkippedEvidence('evidence_full')).toBe(true);
    expect(isSkippedEvidence('evidence_rejected')).toBe(true);
  });

  // Uma conta sem acesso ou uma org bloqueada não é problema do arquivo: o projeto inteiro
  // para, como antes.
  it('keeps stopping the sync for anything about the account or the org', () => {
    expect(isSkippedEvidence('org_blocked')).toBe(false);
    expect(isSkippedEvidence('unauthorized')).toBe(false);
  });
});
