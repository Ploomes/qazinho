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

  it('does NOT take an action of the footer, which Enter would press at once', () => {
    const asking = panelOf(
      '<p>The plan changed</p><footer data-modal-foot="true"><button>Run it here</button><button>Update and run</button></footer>',
    );

    expect(firstFocusOf(asking)).toBe(asking);
    expect(
      firstFocusOf(
        panelOf(
          '<button id="pick">Mine</button><footer data-modal-foot="true"><button>Take in</button></footer>',
        ),
      ).id,
    ).toBe('pick');
  });
});
