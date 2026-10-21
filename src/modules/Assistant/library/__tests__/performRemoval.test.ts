import { describe, expect, it } from 'vitest';
import { performRemoval } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

describe('performRemoval', () => {
  it('deletes a workspace once the QA confirms it on screen', async () => {
    const { port, did } = fakePort();

    expect(
      await performRemoval({
        id: 'c-1',
        call: { name: 'delete_workspace', args: { workspace: 'Login' } },
        port,
      }),
    ).toEqual({
      text: 'Deleted w2 "Login" with its chat, plan, runs and bugs.',
      isError: false,
    });
    expect(did).toEqual(['confirm delete_workspace Login 0', 'remove workspace w2']);
  });

  it('deletes a project with its workspaces, telling the QA how many go', async () => {
    const { port, did } = fakePort();

    expect(
      (
        await performRemoval({
          id: 'c-1',
          call: { name: 'delete_project', args: { project: 'p1' } },
          port,
        })
      ).text,
    ).toBe('Deleted p1 "Lojinha" and its 2 workspaces.');
    expect(did).toEqual(['confirm delete_project Lojinha 2', 'remove project p1']);
  });

  it('does NOT delete what the QA kept, or did not answer for', async () => {
    const kept = fakePort({ decision: 'kept' });
    const expired = fakePort({ decision: 'expired' });

    expect(
      (
        await performRemoval({
          id: 'c-1',
          call: { name: 'delete_project', args: { project: 'p1' } },
          port: kept.port,
        })
      ).text,
    ).toBe('The QA kept p1 "Lojinha".');
    expect(
      (
        await performRemoval({
          id: 'c-1',
          call: { name: 'delete_workspace', args: { workspace: 'w1' } },
          port: expired.port,
        })
      ).text,
    ).toBe('The QA did not answer in time, so w1 is still there.');
    expect(kept.state.projects).toHaveLength(1);
    expect(expired.state.workspaces).toHaveLength(2);
  });

  it('asks nothing about something that is not there', async () => {
    const { port, did } = fakePort();

    expect(
      (
        await performRemoval({
          id: 'c-1',
          call: { name: 'delete_workspace', args: { workspace: 'Pix' } },
          port,
        })
      ).isError,
    ).toBe(true);
    expect(did).toEqual([]);
  });
  describe('delete_variable', () => {
    const KEPT = { p1: [{ name: 'LOJA_EMAIL', description: 'A buyer' }] };

    it('deletes a variable and its value once the QA confirms, naming the plans that still use it', async () => {
      const { port, did, state } = fakePort({ state: { variables: KEPT } });
      const [checkout] = state.workspaces;

      state.workspaces = [
        {
          ...checkout!,
          plan: [
            {
              ...checkout!.plan[0]!,
              steps: [{ action: 'Type ${LOJA_EMAIL} in E-mail', expected: 'It shows' }],
            },
          ],
        },
      ];

      expect(
        await performRemoval({
          id: 'c-1',
          call: {
            name: 'delete_variable',
            args: { project: 'p1', variable: '${LOJA_EMAIL}' },
          },
          port,
        }),
      ).toEqual({
        text: 'Deleted ${LOJA_EMAIL} and its value from p1 "Lojinha". The plans of "Checkout regression" still name it.',
        isError: false,
      });
      expect(did).toEqual([
        'confirm delete_variable LOJA_EMAIL 1',
        'apply p1 [{"kind":"remove","name":"LOJA_EMAIL"}]',
      ]);
    });

    it('does NOT delete a variable the QA kept', async () => {
      const { port, did } = fakePort({ state: { variables: KEPT }, decision: 'kept' });

      expect(
        (
          await performRemoval({
            id: 'c-1',
            call: {
              name: 'delete_variable',
              args: { project: 'p1', variable: 'LOJA_EMAIL' },
            },
            port,
          })
        ).text,
      ).toBe('The QA kept ${LOJA_EMAIL}.');
      expect(did).toEqual(['confirm delete_variable LOJA_EMAIL 0']);
    });

    it('does NOT ask about a variable the project does not keep', async () => {
      const { port, did } = fakePort({ state: { variables: KEPT } });
      const done = await performRemoval({
        id: 'c-1',
        call: { name: 'delete_variable', args: { project: 'p1', variable: 'TOKEN' } },
        port,
      });

      expect(done.isError).toBe(true);
      expect(did).toEqual([]);
    });
  });
});
