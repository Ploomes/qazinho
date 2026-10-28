import { describe, expect, it } from 'vitest';
import { parseAllDocuments } from 'yaml';
import { maestroOf } from '@/main/classes/runs/CodeExport/library';
import { RECIPE, SIGN_IN, STEPS } from './fixtures';

const FLOW = maestroOf({ appId: 'app.qazinho.loja', steps: STEPS, recipe: RECIPE });

describe('maestroOf', () => {
  it('asserts each line of a proof that holds several', () => {
    const flow = maestroOf({
      appId: 'app.qazinho.loja',
      steps: STEPS,
      recipe: {
        ...RECIPE,
        steps: RECIPE.steps.map((step) =>
          step.number === 2 ? { ...step, proof: '1 item\nTotal: R$ 79,90' } : step,
        ),
      },
    });

    expect(flow).toContain('- assertVisible: ".*1 item.*"');
    expect(flow).toContain('- assertVisible: ".*Total: R\\\\$ 79,90.*"');
  });

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
  it("types a project's variable from the environment, and asserts a proof that names one", () => {
    const flow = maestroOf({ appId: 'app.qazinho.loja', steps: STEPS, recipe: SIGN_IN });
    const [head, body] = parseAllDocuments(flow).map(
      (document) => document.toJS() as unknown[],
    );

    expect(flow.split('\n')[0]).toBe(
      "# Types the project's variables from the environment: maestro test -e SHOP_EMAIL=… -e SHOP_PASSWORD=…",
    );
    expect(head).toMatchObject({ appId: 'app.qazinho.loja' });
    expect(body).toContainEqual({ inputText: '${SHOP_EMAIL}' });
    expect(body).toContainEqual({ assertVisible: '.*Welcome, ${SHOP_EMAIL}\\..*' });
  });

  it('does NOT ask for the environment in a flow with no variable', () => {
    expect(FLOW).not.toContain('from the environment');
  });
});
