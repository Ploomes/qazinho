import { describe, expect, it } from 'vitest';
import { parseAllDocuments } from 'yaml';
import { maestroOf } from '@/main/classes/runs/CodeExport/library';
import { RECIPE, STEPS } from './fixtures';

const FLOW = maestroOf({ appId: 'app.qazinho.loja', steps: STEPS, recipe: RECIPE });

describe('maestroOf', () => {
  it('is a flow Maestro reads: its app and name, then the steps', () => {
    const [head, body] = parseAllDocuments(FLOW).map(
      (document) => document.toJS() as unknown,
    );

    expect(head).toEqual({
      appId: 'app.qazinho.loja',
      name: 'TC-01 · Buy the second shirt',
    });
    expect(Array.isArray(body)).toBe(true);
  });

  it('opens the app with its data cleared, then does each step and asserts its proof', () => {
    const [, body] = parseAllDocuments(FLOW).map(
      (document) => document.toJS() as unknown[],
    );

    expect(body?.slice(0, 4)).toEqual([
      { launchApp: { clearState: true } },
      { tapOn: 'E-mail' },
      { inputText: 'qa@loja.test' },
      { tapOn: 'Senha' },
    ]);
    expect(body).toContainEqual({ pressKey: 'Enter' });
    expect(body).toContainEqual({ tapOn: { text: 'Comprar', index: 1 } });
    expect(body).toContainEqual({ assertVisible: '.*Carrinho 1 \\(R\\$ 79,90\\).*' });
  });

  it('scrolls until the words show, swipes for a plain scroll, and long presses', () => {
    const [, body] = parseAllDocuments(
      maestroOf({
        appId: 'app.qazinho.loja',
        steps: STEPS.slice(0, 1),
        recipe: {
          ...RECIPE,
          steps: [
            {
              number: 1,
              actions: [
                { kind: 'scroll', target: 'Row 40', value: 'down' },
                { kind: 'scroll', target: '', value: 'up' },
                { kind: 'long_press', target: 'Row 3 #2', value: '' },
              ],
              proof: 'Row 40',
            },
          ],
        },
      }),
    ).map((document) => document.toJS() as unknown[]);

    expect(body).toContainEqual({
      scrollUntilVisible: { element: { text: '.*Row 40.*' }, direction: 'DOWN' },
    });
    expect(body).toContainEqual({ swipe: { direction: 'DOWN' } });
    expect(body).toContainEqual({ longPressOn: { text: 'Row 3', index: 1 } });
  });

  it('closes the app for real and opens it again for reopen', () => {
    const [, body] = parseAllDocuments(FLOW).map(
      (document) => document.toJS() as unknown[],
    );
    const at = body?.findIndex((one) => one === 'stopApp') ?? -1;

    expect(at).toBeGreaterThan(0);
    expect(body?.[at + 1]).toBe('launchApp');
  });
});
