import { describe, expect, it } from 'vitest';
import { templatesOf } from '@/main/classes/projects/TemplateLibrary/library';

const BUG = {
  id: 't-1',
  kind: 'bug',
  name: 'Bug do time',
  title: '[{{area}}] {{title}}',
  parts: [
    { kind: 'section', field: 'steps', heading: 'Passos' },
    { kind: 'text', text: 'Ambiente: {{app}}' },
  ],
  cases: 'steps',
  updatedAt: '2026-11-13',
};

describe('templatesOf', () => {
  it('reads back what QAzinho wrote', () => {
    expect(templatesOf(JSON.stringify([BUG]))).toEqual([BUG]);
  });

  it('leaves out what someone broke by hand, and keeps the rest', () => {
    expect(
      templatesOf(
        JSON.stringify([
          { ...BUG, kind: 'poem' },
          {
            ...BUG,
            id: 't-2',
            parts: [{ kind: 'section' }, { kind: 'text', text: 'Oi' }],
          },
        ]),
      ),
    ).toEqual([{ ...BUG, id: 't-2', parts: [{ kind: 'text', text: 'Oi' }] }]);
  });

  it('reads no file, or a broken one, as no templates', () => {
    expect(templatesOf('')).toEqual([]);
    expect(templatesOf('{ nope')).toEqual([]);
  });
});
