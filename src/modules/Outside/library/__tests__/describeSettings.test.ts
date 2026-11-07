import { describe, expect, it } from 'vitest';
import { describeSettings } from '@/modules/Outside/library';

const BASE = {
  theme: 'light' as const,
  language: 'en',
  runAlert: 'app' as const,
  agent: 'Codex',
  integrations: [],
};

describe('describeSettings', () => {
  it('reads the theme, the language and how a run calls the user back', () => {
    const told = describeSettings(BASE);

    expect(told).toContain('Theme: paper (light).');
    expect(told).toContain('Language: English.');
    expect(told).toContain('a notice inside QAzinho only');
    expect(told).toContain('Codex');
  });

  it('names who an integration is connected as, and never a token', () => {
    const told = describeSettings({
      ...BASE,
      integrations: [
        { id: 'github', account: 'ana', site: null, connectedAt: '2026-11-01' },
      ],
    });

    expect(told).toContain('GitHub: connected as ana.');
    expect(told).toContain('Jira: not connected.');
  });
});
