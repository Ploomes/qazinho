import type { Locator, Page } from 'playwright-core';

type FakeLocator = { count: () => Promise<number>; first: () => Locator; name: string };

/** A stand-in for the browser: the library talks to a port, so a test does not need Chrome. */
export function fakeLocator(props: { name: string; count: number }): Locator {
  const locator: FakeLocator = {
    name: props.name,
    count: () => Promise.resolve(props.count),
    first: () => locator as unknown as Locator,
  };

  return locator as unknown as Locator;
}

export function fakePage(parts: Partial<Record<string, unknown>>): Page {
  return parts as unknown as Page;
}

export function locatorName(locator: Locator | null): string | null {
  return locator ? (locator as unknown as FakeLocator).name : null;
}
