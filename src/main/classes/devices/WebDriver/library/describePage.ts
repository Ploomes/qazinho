import type { Page } from 'playwright-core';
import { WEB_DRIVER } from '@/main/classes/devices/WebDriver/constants';
import { numberDuplicates } from '@/main/library';
import { listControls } from './listControls';

/** What the agent is allowed to look at: what a person would see, not the markup, with controls that read alike numbered. */
export async function describePage(page: Page): Promise<string> {
  const text = (
    await page
      .locator('body')
      .innerText()
      .catch(() => '')
  )
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, WEB_DRIVER.pageTextLimit);

  const controls = (await listControls(page))
    .slice(0, WEB_DRIVER.elementLimit)
    .map(({ role, label }) => `${role}: ${label}`);

  return [
    `URL: ${page.url()}`,
    `TITLE: ${await page.title()}`,
    'TEXT:',
    text,
    'CONTROLS:',
    ...numberDuplicates(controls),
  ].join('\n');
}
