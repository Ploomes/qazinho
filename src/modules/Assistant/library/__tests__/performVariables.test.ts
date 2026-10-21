import { describe, expect, it } from 'vitest';
import { performVariables } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

const KEPT = { p1: [{ name: 'LOJA_EMAIL', description: 'A buyer on staging' }] };

describe('performVariables', () => {
  describe('ask_variables', () => {
    it('opens the window on the variables asked for, and answers with the names kept', async () => {
      const { port, did } = fakePort();

      expect(
        await performVariables({
          call: {
            name: 'ask_variables',
            args: {
              project: 'Lojinha',
              variables: [
                { name: 'seller email', description: 'A seller on staging' },
                { name: '${SELLER_PASSWORD}', description: 'Its password' },
              ],
            },
          },
          port,
        }),
      ).toEqual({
        text: 'The QA kept ${SELLER_EMAIL}, ${SELLER_PASSWORD} in p1 "Lojinha". Their values are sealed: a step names each as ${NAME}, and you never see one.',
        isError: false,
      });
      expect(did).toEqual(['ask p1 SELLER_EMAIL,SELLER_PASSWORD']);
    });

    it('says so when the QA closed the window without keeping anything', async () => {
      const { port } = fakePort({ kept: null });

      expect(
        (
          await performVariables({
            call: {
              name: 'ask_variables',
              args: { project: 'p1', variables: [{ name: 'TOKEN', description: '' }] },
            },
            port,
          })
        ).text,
      ).toBe('The QA closed the window without keeping anything in p1 "Lojinha".');
    });

    it('does NOT open the window for a project that is not there', async () => {
      const { port, did } = fakePort();
      const done = await performVariables({
        call: {
          name: 'ask_variables',
          args: { project: 'Banco', variables: [{ name: 'TOKEN', description: '' }] },
        },
        port,
      });

      expect(done.isError).toBe(true);
      expect(did).toEqual([]);
    });
  });

  describe('update_variable', () => {
    it('renames a variable, keeping its value, and says the plans follow it', async () => {
      const { port, did } = fakePort({ state: { variables: KEPT } });

      expect(
        await performVariables({
          call: {
            name: 'update_variable',
            args: { project: 'p1', variable: '${LOJA_EMAIL}', name: 'buyer email' },
          },
          port,
        }),
      ).toEqual({
        text: 'Renamed ${LOJA_EMAIL} to ${BUYER_EMAIL} in p1 "Lojinha", and in the plans that named it. Its value stays.',
        isError: false,
      });
      expect(did).toEqual([
        'apply p1 [{"kind":"save","name":"BUYER_EMAIL","description":"A buyer on staging","value":null,"from":"LOJA_EMAIL"}]',
      ]);
    });

    it('changes only what a variable says it holds', async () => {
      const { port } = fakePort({ state: { variables: KEPT } });

      expect(
        (
          await performVariables({
            call: {
              name: 'update_variable',
              args: { project: 'p1', variable: 'LOJA_EMAIL', description: 'The owner' },
            },
            port,
          })
        ).text,
      ).toBe('Changed what ${LOJA_EMAIL} holds in p1 "Lojinha". Its value stays.');
    });

    it('does NOT change a variable the project does not keep, and lists the ones it does', async () => {
      const { port, did } = fakePort({ state: { variables: KEPT } });

      expect(
        await performVariables({
          call: { name: 'update_variable', args: { project: 'p1', variable: 'TOKEN' } },
          port,
        }),
      ).toEqual({
        text: 'p1 "Lojinha" keeps no variable called TOKEN. It keeps ${LOJA_EMAIL}.',
        isError: true,
      });
      expect(did).toEqual([]);
    });

    it('says why the vault refused, in words the agent can act on', async () => {
      const { port } = fakePort({
        state: { variables: KEPT },
        applied: { isSaved: false, failure: { reason: 'taken', name: 'LOJA_EMAIL' } },
      });

      expect(
        (
          await performVariables({
            call: {
              name: 'update_variable',
              args: { project: 'p1', variable: 'LOJA_EMAIL', name: 'TAKEN' },
            },
            port,
          })
        ).text,
      ).toBe(
        'QAzinho could not change ${LOJA_EMAIL}: the project already keeps that name.',
      );
    });
  });
});
