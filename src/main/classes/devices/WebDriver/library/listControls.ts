import type { Page } from 'playwright-core';
import { CONTROL_SELECTOR } from '@/main/classes/devices/WebDriver/constants';

/** The controls a person can see, in page order: the role, the words each goes by, and its place among every control. */
export async function listControls(
  page: Page,
): Promise<{ role: string; label: string; at: number }[]> {
  try {
    return await page.$$eval(CONTROL_SELECTOR, (nodes) =>
      nodes.flatMap((node, at) => {
        const element = node as unknown as {
          getClientRects: () => { length: number };
          getAttribute: (name: string) => string | null;
          innerText: string;
          tagName: string;
        };

        if (element.getClientRects().length === 0) return [];

        const label = (
          element.getAttribute('aria-label') ??
          element.getAttribute('placeholder') ??
          element.getAttribute('name') ??
          element.innerText ??
          ''
        )
          .trim()
          .slice(0, 60);

        return label.length === 0
          ? []
          : [{ role: element.tagName.toLowerCase(), label, at }];
      }),
    );
  } catch {
    return [];
  }
}
