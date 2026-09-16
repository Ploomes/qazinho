import type { Locator, Page } from 'playwright-core';

/** The agent names an element the way a person would; every way of finding it is tried in turn. */
export async function findLocator(props: {
  page: Page;
  target: string;
}): Promise<Locator | null> {
  const { page, target } = props;

  if (target.trim().length === 0) return null;

  const candidates = [
    page.getByRole('button', { name: target }),
    page.getByRole('link', { name: target }),
    page.getByLabel(target),
    page.getByPlaceholder(target),
    page.getByText(target, { exact: false }),
    page.locator(target),
  ];

  for (const candidate of candidates) {
    const count = await candidate.count().catch(() => 0);

    if (count > 0) return candidate.first();
  }

  return null;
}
