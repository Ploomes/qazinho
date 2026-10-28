import type { SyncedProject } from '@/main/classes/pro/ProDownloads/types';

/**
 * Um projeto como a org o responde: um alvo web e um Android, um plano em cada, e uma
 * variável.
 */
export const SYNCED: SyncedProject = {
  id: 'pp1',
  desktopId: 'p-1760000000000',
  key: 'LOJA',
  name: 'Loja — staging',
  targets: [
    { id: 't-web', kind: 'web', label: 'Web', value: 'https://staging.loja.dev' },
    { id: 't-android', kind: 'android', label: 'Android', value: 'loja.apk' },
  ],
  repositories: [{ id: '4242', owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
  variables: [{ name: 'LOGIN_PASSWORD', description: 'senha do QA' }],
  plans: [
    {
      id: 'plan-1',
      desktopId: 'w-1760000000001',
      name: 'Checkout com Pix',
      version: 3,
      targetId: 't-web',
      targetKind: 'web',
      issue: {
        key: 'LOJA-12',
        title: 'Pix',
        source: 'jira',
        url: 'https://loja.atlassian.net/browse/LOJA-12',
      },
      design: null,
      cases: [
        {
          id: 'TC-01',
          title: 'Pagar com Pix',
          priority: 'P1',
          goal: 'Pagar',
          preconditions: '',
          steps: [{ action: 'Copiar o código', expected: 'O código é copiado' }],
        },
      ],
    },
    {
      id: 'plan-2',
      desktopId: 'w-1760000000002',
      name: 'Login no app',
      version: 1,
      targetKind: 'android',
      cases: [],
    },
  ],
};
