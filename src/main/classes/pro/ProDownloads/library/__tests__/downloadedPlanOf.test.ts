import { describe, expect, it } from 'vitest';
import { downloadedPlanOf } from '@/main/classes/pro/ProDownloads/library';
import { SYNCED } from './fixtures';

describe('downloadedPlanOf', () => {
  it('turns a plan into a workspace on the target it names', () => {
    expect(
      downloadedPlanOf({ plan: SYNCED.plans[0]!, targets: SYNCED.targets }),
    ).toMatchObject({
      workspaceId: 'w-1760000000001',
      name: 'Checkout com Pix',
      targetId: 't-web',
      targetKind: 'web',
      issue: { key: 'LOJA-12' },
      design: null,
      cases: [{ id: 'TC-01' }],
    });
  });

  it('falls back to a target of the plan’s kind, then to the project’s first', () => {
    expect(
      downloadedPlanOf({ plan: SYNCED.plans[1]!, targets: SYNCED.targets }),
    ).toMatchObject({
      targetId: 't-android',
      targetKind: 'android',
      issue: null,
      design: null,
    });
    expect(
      downloadedPlanOf({
        plan: { ...SYNCED.plans[1]!, targetKind: 'ios' },
        targets: SYNCED.targets,
      }),
    ).toMatchObject({ targetId: 't-web', targetKind: 'web' });
  });
});
