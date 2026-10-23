// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { focusablesIn } from '@/shared/components/templates/ModalFrame/library';

describe('focusablesIn', () => {
  it('lists what Tab reaches, in order, and skips what it cannot', () => {
    const root = document.createElement('div');

    root.innerHTML = [
      '<input id="name">',
      '<input id="secret" type="hidden">',
      '<button id="off" disabled>Off</button>',
      '<div aria-hidden="true"><button id="hidden">Hidden</button></div>',
      '<span id="tip" tabindex="0">tip</span>',
      '<span tabindex="-1">no</span>',
      '<button id="create">Create</button>',
    ].join('');

    expect(focusablesIn(root).map(({ id }) => id)).toEqual(['name', 'tip', 'create']);
  });
});
