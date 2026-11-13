import type { IWalkRun } from '@/main/classes/runs/RunCoordinator/types';
import type { TargetKind } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { driverFor } from '@/main/classes/runs/RunCoordinator/library';
import {
  AndroidDriver,
  IosDriver,
  WebDriver,
} from '@salve-software/qazinho-harness/engine';

function run(props: { kind: TargetKind; value: string }): IWalkRun {
  return {
    workspaceId: 'w1',
    agentId: 'claude-code',
    model: 'sonnet',
    target: props,
    runId: 'r-01',
    steps: [],
    language: 'en',
    command: '/bin/claude',
    shotDir: '/tmp/shots',
    profileDir: '/tmp/profile',
    sdkRoot: '/sdk',
    avd: 'Pixel',
    axe: '/opt/homebrew/bin/axe',
    udid: 'UDID',
    values: [],
    uploads: [],
    uploadPath: () => Promise.resolve(null),
    uploadRefs: new Map(),
  };
}

describe('driverFor', () => {
  it('drives a URL with a browser', () => {
    expect(
      driverFor({ run: run({ kind: 'web', value: 'https://shop.test' }) }),
    ).toBeInstanceOf(WebDriver);
  });

  it('drives an apk with a phone', () => {
    expect(
      driverFor({ run: run({ kind: 'android', value: '/tmp/app.apk' }) }),
    ).toBeInstanceOf(AndroidDriver);
  });

  it('drives a simulator build with axe', () => {
    expect(
      driverFor({ run: run({ kind: 'ios', value: '/tmp/App.app' }) }),
    ).toBeInstanceOf(IosDriver);
  });
});
