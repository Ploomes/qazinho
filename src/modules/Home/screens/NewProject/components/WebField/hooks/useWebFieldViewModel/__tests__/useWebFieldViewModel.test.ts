// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWebFieldViewModel } from '@/modules/Home/screens/NewProject/components/WebField/hooks';

const view = (value: string) =>
  renderHook(() => useWebFieldViewModel({ value, onChange: vi.fn() })).result.current;

describe('useWebFieldViewModel', () => {
  it('says the address is ready, by its host', () => {
    expect(view('staging.loja.dev')).toMatchObject({
      statusText: 'Ready: staging.loja.dev',
      statusClassName: 'field-card__status field-card__status--ok',
    });
  });

  it('says what is wrong with something that is not an address', () => {
    expect(view('a loja de staging').statusClassName).toContain('--bad');
  });

  it('says nothing before anything is typed', () => {
    expect(view('  ')).toMatchObject({
      statusText: '',
      statusClassName: 'field-card__status',
    });
  });
});
