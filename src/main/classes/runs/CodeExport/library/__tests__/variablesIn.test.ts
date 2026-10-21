import { describe, expect, it } from 'vitest';
import { variablesIn } from '@/main/classes/runs/CodeExport/library';
import { RECIPE, SIGN_IN } from './fixtures';

describe('variablesIn', () => {
  it('names each variable the cases type or check, once, in the order they come', () => {
    expect(variablesIn([SIGN_IN, SIGN_IN])).toEqual(['SHOP_EMAIL', 'SHOP_PASSWORD']);
  });

  it('finds a variable in a prompt and in a target too', () => {
    expect(
      variablesIn([
        {
          ...RECIPE,
          steps: [
            {
              number: 1,
              actions: [
                { kind: 'click', target: 'Hi ${NAME}', value: '', promptText: '${CODE}' },
              ],
              proof: '',
            },
          ],
        },
      ]),
    ).toEqual(['NAME', 'CODE']);
  });

  it('finds none in cases that type no variable', () => {
    expect(variablesIn([RECIPE])).toEqual([]);
  });
});
