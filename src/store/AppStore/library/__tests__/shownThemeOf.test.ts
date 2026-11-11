import { describe, expect, it } from 'vitest';
import { shownThemeOf } from '@/store/AppStore/library';

describe('shownThemeOf', () => {
  it('draws the theme the QA chose, whatever the computer uses', () => {
    expect(shownThemeOf({ theme: 'dark', systemTheme: 'light' })).toBe('dark');
    expect(shownThemeOf({ theme: 'light', systemTheme: 'dark' })).toBe('light');
  });

  it('follows the computer when the QA chose the system', () => {
    expect(shownThemeOf({ theme: 'system', systemTheme: 'light' })).toBe('light');
    expect(shownThemeOf({ theme: 'system', systemTheme: 'dark' })).toBe('dark');
  });
});
