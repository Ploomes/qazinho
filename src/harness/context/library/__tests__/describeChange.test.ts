import type { IBrokenTest } from '@/harness/types';
import { describe, expect, it } from 'vitest';
import { describeChange } from '@/harness/context/library';

const BROKEN: IBrokenTest = {
  title: 'CT-NAV-002 · Abre o carrinho pelo menu',
  file: 'tests/hc-1139/ct-nav.spec.ts',
  line: 13,
  project: 'chromium',
  path: ['CT-NAV · Navegação'],
  error:
    "TimeoutError: locator.click: waiting for getByRole('link', { name: 'Meu carrinho' })",
  notes: '# Page snapshot\n\n```yaml\n- link "Carrinho 0"\n```',
  screenshots: ['/data/suites/p-1/runs/s-03/output/1/a/test-failed-1.png'],
};

const BRIEF = {
  dir: '/data/suites/p-1/changes/c-01/work/e2e',
  config: 'playwright.config.ts',
  projects: ['chromium', 'salva-versao'],
  branch: 'qazinho/fix-ct-nav-002',
  base: 'main',
  commit: 'c0ffee1234',
  commits: ['fix(hc-1139): wait for the menu', 'feat(hc-1201): search by name'],
  broken: BROKEN,
};

describe('describeChange', () => {
  it('tells the agent where the suite is, how it is set up and how the team commits', () => {
    const [suite] = describeChange(BRIEF);

    expect(suite?.lines).toEqual([
      'The suite is in /data/suites/p-1/changes/c-01/work/e2e: read and change files there, and nowhere else.',
      'Its config is playwright.config.ts, with the Playwright projects chromium, salva-versao.',
      'This copy is on the branch qazinho/fix-ct-nav-002, made from main at commit c0ffee1.',
      "The team's latest commit messages:",
      '- fix(hc-1139): wait for the menu',
      '- feat(hc-1201): search by name',
    ]);
  });

  it('tells the test that broke, how, what the page held and where its screenshot is', () => {
    const lines = describeChange(BRIEF)[1]?.lines ?? [];

    expect(lines[0]).toBe(
      'CT-NAV-002 · Abre o carrinho pelo menu, written in tests/hc-1139/ct-nav.spec.ts:13, inside "CT-NAV · Navegação".',
    );
    expect(lines).toContain('It runs in the Playwright project chromium.');
    expect(lines).toContain(BROKEN.error);
    expect(lines).toContain(BROKEN.notes);
    expect(lines.at(-1)).toBe(
      'Its screenshot: /data/suites/p-1/runs/s-03/output/1/a/test-failed-1.png',
    );
  });

  /** The notes hold fenced blocks of their own; a fence of four keeps them inside. */
  it('fences what Playwright noted with four backticks, so its own blocks stay inside', () => {
    const lines = describeChange(BRIEF)[1]?.lines ?? [];
    const notes = lines.indexOf(BROKEN.notes);

    expect([lines[notes - 1], lines[notes + 1]]).toEqual(['````markdown', '````']);
  });

  it('leaves out what is missing: no project, no notes, no screenshot, a detached commit, no commits', () => {
    const sections = describeChange({
      ...BRIEF,
      projects: [],
      base: '',
      commits: [],
      broken: { ...BROKEN, project: '', path: [], notes: '', screenshots: [] },
    });
    const text = sections.flatMap(({ lines }) => lines).join('\n');

    expect(text).toContain('with no Playwright project of its own');
    expect(text).toContain('made from a commit with no branch');
    expect(text).not.toContain('latest commit');
    expect(text).not.toContain('noted');
    expect(text).not.toContain('screenshot');
    expect(sections[1]?.lines[0]).toBe(
      'CT-NAV-002 · Abre o carrinho pelo menu, written in tests/hc-1139/ct-nav.spec.ts:13.',
    );
  });
});
