import { describe, expect, it } from 'vitest';
import { withoutSecret } from '@/modules/Project/library';

describe('withoutSecret', () => {
  it('takes the token out and closes the gap it leaves before a comma', () => {
    expect(
      withoutSecret({
        text: 'meu token do jira é ATATT3xFfGF0abc123def456, conecta aí pra mim',
        secret: 'ATATT3xFfGF0abc123def456',
      }),
    ).toBe('meu token do jira é, conecta aí pra mim');
  });

  it('takes out every copy, and does NOT join the lines the QA broke', () => {
    expect(
      withoutSecret({
        text: 'usa ghp_a1b2 aqui\ne ghp_a1b2 ali',
        secret: 'ghp_a1b2',
      }),
    ).toBe('usa aqui\ne ali');
  });
});
