import type { Locator, Page } from 'playwright-core';
import { ordinalOf, withoutRole } from '@/main/library';

async function locate(props: {
  page: Page;
  target: string;
  kind: 'click' | 'fill';
}): Promise<Locator | null> {
  const { page, kind } = props;
  const { name, nth } = ordinalOf(props.target.trim());

  if (name.length === 0) return null;

  const fields = [
    page.getByLabel(name, { exact: true }),
    page.getByPlaceholder(name, { exact: true }),
    page.getByRole('textbox', { name, exact: true }),
    page.getByLabel(name),
    page.getByPlaceholder(name),
    page.getByRole('textbox', { name }),
    page.getByRole('combobox', { name }),
  ];
  const controls = [
    page.getByRole('button', { name, exact: true }),
    page.getByRole('link', { name, exact: true }),
    page.getByRole('button', { name }),
    page.getByRole('link', { name }),
    page.getByRole('checkbox', { name }),
    page.getByRole('radio', { name }),
    page.getByRole('tab', { name }),
    page.getByRole('menuitem', { name }),
    page.getByRole('option', { name }),
  ];
  const texts = [page.getByText(name, { exact: true }), page.getByText(name)];
  const candidates =
    kind === 'fill'
      ? [...fields, ...controls, ...texts, page.locator(name)]
      : [...controls, ...fields, ...texts, page.locator(name)];

  for (const candidate of candidates) {
    const shown = candidate.filter({ visible: true });
    const count = await shown.count().catch(() => 0);

    if (count > nth) return shown.nth(nth);
  }

  return null;
}

/** Finds what the agent named the way a person would: a field to type in, a control to click, the exact name first, "#2" for the second of several, and a control copied as look lists it. */
export async function findLocator(props: {
  page: Page;
  target: string;
  kind: 'click' | 'fill';
}): Promise<Locator | null> {
  const found = await locate(props);
  const listed = withoutRole(props.target);

  return found ?? (listed === null ? null : locate({ ...props, target: listed }));
}
