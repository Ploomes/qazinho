import { describe, expect, it } from 'vitest';
import {
  fillValues,
  renderParts,
  templateFor,
  textOfBlocks,
} from '@/modules/Template/library';

const SECTIONS = {
  steps: [{ kind: 'steps' as const, items: [{ text: 'Aplicar o cupom', isBad: true }] }],
  expected: [{ kind: 'paragraph' as const, text: 'O total cai 10%' }],
  requests: [],
};

/** Um modelo monta sem IA: a mesma entrada sai sempre do mesmo jeito. */
describe('the templates', () => {
  describe('renderParts', () => {
    it('lays out each section in the template’s order, under the heading the team uses', () => {
      expect(
        renderParts({
          parts: [
            { kind: 'section', field: 'expected', heading: 'Resultado esperado' },
            { kind: 'section', field: 'steps', heading: 'Como reproduzir' },
          ],
          sections: SECTIONS,
          values: {},
        }),
      ).toEqual([
        { kind: 'heading', text: 'Resultado esperado' },
        ...SECTIONS.expected,
        { kind: 'heading', text: 'Como reproduzir' },
        ...SECTIONS.steps,
      ]);
    });

    it('leaves out a section with nothing to show, and its heading with it', () => {
      expect(
        renderParts({
          parts: [{ kind: 'section', field: 'requests', heading: 'Rede' }],
          sections: SECTIONS,
          values: {},
        }),
      ).toEqual([]);
    });

    it('fills the fields of a text, and reads lines with a dash as a list', () => {
      expect(
        renderParts({
          parts: [
            {
              kind: 'text',
              text: 'Ambiente: {{app}}\nSeveridade: Alta\n\n- Caso {{case}}\n- {{story}}',
            },
          ],
          sections: {},
          values: { app: 'loja.test', case: 'TC-04', story: 'SHOP-878' },
        }),
      ).toEqual([
        { kind: 'paragraph', text: 'Ambiente: loja.test\nSeveridade: Alta' },
        { kind: 'list', items: ['Caso TC-04', 'SHOP-878'] },
      ]);
    });
  });

  describe('fillValues', () => {
    it('writes a field it does not know as nothing', () => {
      expect(
        fillValues({ text: '[{{area}}] {{ title }}', values: { title: 'O total' } }),
      ).toBe('[] O total');
    });
  });

  describe('textOfBlocks', () => {
    it('writes blocks as the text a QA edits before posting', () => {
      expect(
        textOfBlocks([
          { kind: 'paragraph', text: 'Atualizei o plano.' },
          { kind: 'list', items: ['TC-04: 5 tentativas'] },
          ...SECTIONS.steps,
        ]),
      ).toBe('Atualizei o plano.\n\n- TC-04: 5 tentativas\n\n1. Aplicar o cupom');
    });
  });

  describe('templateFor', () => {
    const MINE = {
      id: 't-1',
      kind: 'bug' as const,
      name: 'Bug do time',
      title: '',
      parts: [],
      cases: 'steps' as const,
      updatedAt: '',
    };
    const DEFAULT = {
      ...MINE,
      id: 'org:loja:t-9',
      name: 'Bug da org',
      orgSlug: 'loja',
      isDefault: true,
      author: 'Ana',
    };
    const ORG = {
      orgSlug: 'loja',
      templates: [DEFAULT, { ...DEFAULT, id: 'org:loja:t-8', isDefault: false }],
      canPublish: true,
      canSetDefault: false,
    };

    it('takes the template the QA chose in the project, the org’s too', () => {
      expect(
        templateFor({ kind: 'bug', chosen: { bug: 't-1' }, templates: [MINE], org: ORG }),
      ).toBe(MINE);
      expect(
        templateFor({
          kind: 'bug',
          chosen: { bug: 'org:loja:t-8' },
          templates: [MINE],
          org: ORG,
        })?.id,
      ).toBe('org:loja:t-8');
    });

    it('falls back to the default of the org, then to QAzinho’s own way', () => {
      expect(templateFor({ kind: 'bug', chosen: {}, templates: [MINE], org: ORG })).toBe(
        DEFAULT,
      );
      expect(
        templateFor({
          kind: 'bug',
          chosen: undefined,
          templates: [MINE],
          org: undefined,
        }),
      ).toBeNull();
    });

    it('never takes the org’s default of another kind', () => {
      expect(
        templateFor({ kind: 'plan', chosen: {}, templates: [MINE], org: ORG }),
      ).toBeNull();
    });

    it('keeps QAzinho’s own way when the QA chose it over the org’s', () => {
      expect(
        templateFor({ kind: 'bug', chosen: { bug: 'qazinho' }, templates: [], org: ORG }),
      ).toBeNull();
    });
  });
});
