import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { describe, expect, it } from 'vitest';

/** A assinatura de um PNG e alguns bytes: como começa o screenshot de um celular. */
const SHOT = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

/**
 * O Baixar do lightbox, na janela empacotada: a main lê o screenshot do archive e o
 * escreve onde o diálogo de salvar diz. O diálogo é do SO, então o da main é respondido
 * por ele, e o teste lê de volta o que caiu no disco. A pasta de dados é o caminho real
 * dela: no macOS o Electron vê /var como /private/var, e o archive não lê nada fora da
 * própria pasta.
 */
describe('saving a screenshot', () => {
  it('writes the screenshot where the QA picked, named for what it shows', async () => {
    const dir = await realpath(await mkdtemp(join(tmpdir(), 'qazinho-save-')));
    const shot = join(dir, 'runs', 'w-1', 'r-01', 'step-1.jpg');
    const saved = join(dir, 'saved.png');

    await mkdir(join(dir, 'runs', 'w-1', 'r-01'), { recursive: true });
    await writeFile(shot, SHOT);
    await writeFile(
      join(dir, 'projects.json'),
      JSON.stringify([
        {
          id: 'p-1',
          name: 'Shop',
          targets: [
            { id: 't-web', kind: 'web', label: 'Web', value: 'https://shop.test' },
          ],
        },
      ]),
    );
    await mkdir(join(dir, 'workspaces', 'w-1'), { recursive: true });
    await writeFile(join(dir, 'workspaces', 'w-1', 'plan.yaml'), 'cases: []\n');
    await writeFile(
      join(dir, 'workspaces', 'w-1', 'workspace.json'),
      JSON.stringify({
        id: 'w-1',
        projectId: 'p-1',
        name: 'checkout',
        targetId: 't-web',
        planKind: 'web',
        sessionId: null,
        status: 'failed',
        issue: null,
        chat: [],
        runs: [],
        bugs: [
          {
            id: 'BUG-01',
            severity: 'high',
            title: 'The coupon is taken after it expired',
            body: 'An expired coupon still takes 10% off.',
            expected: 'The coupon is refused',
            got: '10% off',
            runId: 'r-01',
            runWhen: '09:41',
            caseId: 'TC-01',
            caseTitle: 'Coupon',
            stepNumber: 1,
            target: 'Web · Chrome 1280 × 800',
            seenRuns: 1,
            repro: [{ action: 'Apply EXPIRED10', isBad: true }],
            shots: [{ isBad: true, src: null, file: shot }],
            isNew: false,
          },
        ],
        hasBeenAsked: false,
        viewportId: 'desktop',
        context: { tokens: 0, window: 1 },
        live: null,
      }),
    );

    const app = await electron.launch({
      args: [join(process.cwd(), 'out', 'main', 'index.js'), `--user-data-dir=${dir}`],
    });
    const asked: string[] = [];

    await app.evaluate(({ dialog }, target) => {
      dialog.showSaveDialog = async (...given: unknown[]) => {
        const options = given.at(-1) as { defaultPath?: string };

        (globalThis as unknown as { asked: string[] }).asked = [
          options.defaultPath ?? '',
        ];

        return { canceled: false, filePath: target };
      };
    }, saved);

    const page = await app.firstWindow();

    await page.waitForSelector('.titlebar');
    if ((await page.locator('.onboarding__skip').count()) > 0)
      await page.locator('.onboarding__skip').click();
    await page.getByText('checkout').first().click();
    await page.getByText(/^Bugs/).first().click();
    if ((await page.locator('.bug-card__shots').count()) === 0)
      await page.locator('.bug-card__head').first().click();
    await page.locator('.bug-card__shots button').first().click();
    await page.getByRole('button', { name: 'Download' }).click();
    await page.getByRole('button', { name: 'Saved' }).waitFor();

    asked.push(
      ...(await app.evaluate(() => (globalThis as unknown as { asked: string[] }).asked)),
    );

    expect(await readFile(saved)).toEqual(SHOT);
    expect(asked[0]).toMatch(/BUG-01 · step 1 · the step that broke\.png$/);

    await app.close();
  }, 120_000);
});
