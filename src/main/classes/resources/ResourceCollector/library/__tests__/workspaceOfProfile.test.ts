import { describe, expect, it } from 'vitest';
import { workspaceOfProfile } from '@/main/classes/resources/ResourceCollector/library';

const ROOT = '/Users/qa/Library/Application Support/gocrash/profiles';

describe('workspaceOfProfile', () => {
  it('reads the workspace a browser was started for out of its own flags', () => {
    const command = `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=${ROOT}/w-42 --no-first-run`;

    expect(workspaceOfProfile({ command, profileRoot: ROOT })).toBe('w-42');
  });

  it('a helper process started under the same profile belongs to it too', () => {
    const command = `Google Chrome Helper (Renderer) --user-data-dir=${ROOT}/w-42/Default`;

    expect(workspaceOfProfile({ command, profileRoot: ROOT })).toBe('w-42');
  });

  it('a browser the QA opened themselves belongs to nobody', () => {
    const command = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    expect(workspaceOfProfile({ command, profileRoot: ROOT })).toBeNull();
  });

  it('the profiles folder with nothing under it names no workspace', () => {
    expect(workspaceOfProfile({ command: ROOT, profileRoot: ROOT })).toBeNull();
  });
});
