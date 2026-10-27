// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { firstFocusOf } from '@/shared/components/templates/ModalFrame/library';

const panelOf = (html: string) => {
  const panel = document.createElement('div');

  panel.innerHTML = html;

  return panel;
};

describe('firstFocusOf', () => {
  it('takes the first field, so the QA types at once', () => {
    const panel = panelOf(
      '<nav><button aria-current="true">General</button></nav><input id="name">',
    );

    expect(firstFocusOf(panel).id).toBe('name');
  });

  it('takes the section the window opened on, NOT the first one, when it has no field', () => {
    const panel = panelOf(
      '<nav><button aria-current="false">General</button><button id="pro" aria-current="true">QAzinho Pro</button></nav><button>Publish</button>',
    );

    expect(firstFocusOf(panel).id).toBe('pro');
  });

  it('takes the first control of a window with no nav, or the window itself with none', () => {
    expect(firstFocusOf(panelOf('<button id="ok">OK</button>')).id).toBe('ok');

    const empty = panelOf('<p>Nothing to press</p>');

    expect(firstFocusOf(empty)).toBe(empty);
  });
});
