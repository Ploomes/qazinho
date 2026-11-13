import type { INewProjectValues } from '@/modules/Home/types';

/** Nada preenchido, o começo de toda criação de projeto. */
export const EMPTY_VALUES: INewProjectValues = {
  web: '',
  builds: [],
  repositories: [],
  tests: null,
  story: null,
  design: null,
};

export const STORY = {
  kind: 'jira' as const,
  issue: {
    key: 'SHOP-892',
    summary: 'frete grátis acima de R$ 200',
    url: 'https://acme.atlassian.net/browse/SHOP-892',
  },
};

export const DESIGN = {
  url: 'https://www.figma.com/design/abc/Loja?node-id=1-2',
  fileKey: 'abc',
  nodeId: '1:2',
  name: 'Checkout',
};

export const TESTS = {
  name: 'loja-web',
  dir: '/Users/qa/code/loja-web',
  frameworks: [{ id: 'playwright', files: 2 }],
  files: ['tests/checkout.spec.ts', 'tests/busca.spec.ts'],
  branch: 'main',
  commit: 'a1b2c3',
};

export const LABELS = { web: 'Web', android: 'Android', ios: 'iOS' };
