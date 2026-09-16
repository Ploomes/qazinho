import { describe, expect, it } from 'vitest';
import { findLocator } from '@/main/classes/devices/WebDriver/library';
import { fakeLocator, fakePage, locatorName } from './fakePage';

function pageWhereOnly(found: string) {
  const answer = (name: string) => fakeLocator({ name, count: name === found ? 1 : 0 });

  return fakePage({
    getByRole: (role: string) => answer(`role:${role}`),
    getByLabel: () => answer('label'),
    getByPlaceholder: () => answer('placeholder'),
    getByText: () => answer('text'),
    locator: () => answer('css'),
  });
}

describe('findLocator', () => {
  it('a button wins before anything else is tried', async () => {
    const page = pageWhereOnly('role:button');

    expect(locatorName(await findLocator({ page, target: 'Sign in' }))).toBe(
      'role:button',
    );
  });

  it('falls through to the label when no button answers', async () => {
    const page = pageWhereOnly('label');

    expect(locatorName(await findLocator({ page, target: 'Email' }))).toBe('label');
  });

  it('a css selector is the last thing tried, not the first', async () => {
    const page = pageWhereOnly('css');

    expect(locatorName(await findLocator({ page, target: '#submit' }))).toBe('css');
  });

  it('nothing on the page answering is null, not a locator that finds nothing', async () => {
    const page = pageWhereOnly('nothing');

    expect(await findLocator({ page, target: 'Ghost' })).toBeNull();
  });

  it('a blank target never touches the page', async () => {
    const page = fakePage({});

    expect(await findLocator({ page, target: '  ' })).toBeNull();
  });

  it('a locator that throws while counting is treated as no match', async () => {
    const page = fakePage({
      getByRole: () => ({ count: () => Promise.reject(new Error('bad selector')) }),
      getByLabel: () => fakeLocator({ name: 'label', count: 1 }),
      getByPlaceholder: () => fakeLocator({ name: 'placeholder', count: 0 }),
      getByText: () => fakeLocator({ name: 'text', count: 0 }),
      locator: () => fakeLocator({ name: 'css', count: 0 }),
    });

    expect(locatorName(await findLocator({ page, target: 'Email' }))).toBe('label');
  });
});
