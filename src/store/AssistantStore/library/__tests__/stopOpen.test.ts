import type { AssistantMessage } from '@/modules/Assistant/types';
import { describe, expect, it } from 'vitest';
import { stopOpen } from '@/store/AssistantStore/library';

const MESSAGES: AssistantMessage[] = [
  { kind: 'user', id: 'm-1', text: 'Apaga o Login' },
  {
    kind: 'tool',
    id: 'c-1',
    call: { name: 'workspace_details', args: { workspace: 'w2' } },
    subject: 'Login',
    state: 'done',
  },
  {
    kind: 'tool',
    id: 'c-2',
    call: { name: 'go_home', args: {} },
    subject: '',
    state: 'doing',
  },
  {
    kind: 'confirm',
    id: 'c-3',
    action: 'delete_workspace',
    subject: 'Login',
    count: 0,
    decision: null,
  },
  {
    kind: 'confirm',
    id: 'c-4',
    action: 'delete_project',
    subject: 'Loja',
    count: 1,
    decision: 'kept',
  },
];

describe('stopOpen', () => {
  it('fails the tool still going and runs out the confirmation nobody answered', () => {
    const stopped = stopOpen(MESSAGES);

    expect(stopped[2]).toMatchObject({ state: 'failed' });
    expect(stopped[3]).toMatchObject({ decision: 'expired' });
  });

  it('does NOT touch what already ended', () => {
    const stopped = stopOpen(MESSAGES);

    expect(stopped[0]).toBe(MESSAGES[0]);
    expect(stopped[1]).toBe(MESSAGES[1]);
    expect(stopped[4]).toBe(MESSAGES[4]);
  });
});
