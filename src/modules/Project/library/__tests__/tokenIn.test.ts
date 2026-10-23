import { describe, expect, it } from 'vitest';
import { tokenIn } from '@/modules/Project/library';

describe('tokenIn', () => {
  it('finds a Jira or GitHub token, or an API key, in what the QA typed', () => {
    expect(tokenIn('meu token do jira é ATATT3xFfGF0abc123def456, conecta')).toBe(
      'ATATT3xFfGF0abc123def456',
    );
    expect(tokenIn('usa ghp_a1b2c3d4e5f6g7h8i9j0k1l2 aí')).toBe(
      'ghp_a1b2c3d4e5f6g7h8i9j0k1l2',
    );
    expect(tokenIn('github_pat_11ABCDEFG0123456789_abcdefghijkl')).toBe(
      'github_pat_11ABCDEFG0123456789_abcdefghijkl',
    );
    expect(tokenIn('a chave é sk-ant-api03-abcdefghijklmnopqrstu')).toBe(
      'sk-ant-api03-abcdefghijklmnopqrstu',
    );
    expect(tokenIn('AKIAIOSFODNN7EXAMPLE')).toBe('AKIAIOSFODNN7EXAMPLE');
  });

  it('does NOT take ids, words or short codes for a token', () => {
    expect(tokenIn('abre o BUG-01 e a run r-02 do w-1792568000698')).toBeNull();
    expect(tokenIn('o cupom EXPIRADO10 foi aceito')).toBeNull();
    expect(tokenIn('sk-short e ghp_curto')).toBeNull();
  });
});
