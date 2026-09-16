import { describe, expect, it } from 'vitest';
import { migrateSettings } from '@/store/SettingsStore/library';

describe('migrateSettings', () => {
  it('hands the model back to the agent for settings saved before version 1', () => {
    expect(
      migrateSettings({
        persisted: { agent: 'Claude Code', model: 'haiku' },
        version: 0,
      }),
    ).toEqual({ agent: 'Claude Code', model: '' });
  });

  it('does NOT touch a model picked once the default was the agent own', () => {
    const persisted = { agent: 'Claude Code', model: 'opus' };

    expect(migrateSettings({ persisted, version: 1 })).toBe(persisted);
  });

  it('leaves anything that is not a settings object alone', () => {
    expect(migrateSettings({ persisted: null, version: 0 })).toBeNull();
  });
});
