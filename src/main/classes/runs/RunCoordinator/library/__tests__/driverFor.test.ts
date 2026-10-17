import type { IWalkRun } from '@/main/classes/runs/RunCoordinator/types';
import type { TargetKind } from '@/types';
import { describe, expect, it } from 'vitest';
import { AndroidDriver } from '@/main/classes/devices/AndroidDriver';
import { IosDriver } from '@/main/classes/devices/IosDriver';
import { WebDriver } from '@/main/classes/devices/WebDriver';
import { driverFor } from '@/main/classes/runs/RunCoordinator/library';

function run(props: { kind: TargetKind; value: string }): IWalkRun {
  return {
    workspaceId: 'w1',
    agentId: 'claude-code',
    model: 'sonnet',
    target: props,
    runId: 'r-01',
    steps: [],
    command: '/bin/claude',
    shotDir: '/tmp/shots',
    profileDir: '/tmp/profile',
    sdkRoot: '/sdk',
    avd: 'Pixel',
    idb: '/opt/homebrew/bin/idb',
    udid: 'UDID',
  };
}

describe('driverFor', () => {
  it('drives a URL with a browser', () => {
    expect(driverFor(run({ kind: 'web', value: 'https://shop.test' }))).toBeInstanceOf(
      WebDriver,
    );
  });

  it('drives an apk with a phone', () => {
    expect(driverFor(run({ kind: 'android', value: '/tmp/app.apk' }))).toBeInstanceOf(
      AndroidDriver,
    );
  });

  it('drives a simulator build with idb', () => {
    expect(driverFor(run({ kind: 'ios', value: '/tmp/App.app' }))).toBeInstanceOf(
      IosDriver,
    );
  });
});
