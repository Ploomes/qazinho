import type { Page } from 'playwright-core';
import { WEB_DRIVER } from '@/main/classes/devices/WebDriver/constants';

/** What the agent is allowed to look at: what a person would see, not the markup. */
export async function describePage(page: Page): Promise<string> {
  const text = (
    await page
      .locator('body')
      .innerText()
      .catch(() => '')
  )
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, WEB_DRIVER.pageTextLimit);

  const controls = await page
    .$$eval(
      'button, a, input, select, textarea, [role=button], [role=link]',
      (nodes, limit) =>
        nodes
          .slice(0, limit)
          .map((node) => {
            // The callback runs in the page, where DOM types are not in this project's lib.
            const element = node as unknown as {
              getAttribute: (name: string) => string | null;
              innerText: string;
              tagName: string;
            };
            const label =
              element.getAttribute('aria-label') ??
              element.getAttribute('placeholder') ??
              element.getAttribute('name') ??
              element.innerText;

            return `${element.tagName.toLowerCase()}: ${(label || '').trim().slice(0, 60)}`;
          })
          .filter((line) => line.length > 4),
      WEB_DRIVER.elementLimit,
    )
    .catch(() => []);

  return [
    `URL: ${page.url()}`,
    `TITLE: ${await page.title()}`,
    'TEXT:',
    text,
    'CONTROLS:',
    ...controls,
  ].join('\n');
}
