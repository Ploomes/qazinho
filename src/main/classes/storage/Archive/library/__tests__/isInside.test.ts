import { describe, expect, it } from 'vitest';
import { isInside } from '@/main/classes/storage/Archive/library';

const ROOT = '/Users/qa/Library/Application Support/QAzinho';

describe('isInside', () => {
  it('a screenshot QAzinho wrote is inside its own folder', () => {
    expect(isInside({ root: ROOT, file: `${ROOT}/runs/w1/r-01/step-1.jpg` })).toBe(true);
  });

  it('climbing out of the folder is refused', () => {
    expect(isInside({ root: ROOT, file: `${ROOT}/../../.ssh/id_rsa` })).toBe(false);
  });

  it('an absolute path somewhere else is refused', () => {
    expect(isInside({ root: ROOT, file: '/etc/passwd' })).toBe(false);
  });

  it('the folder itself is not a file inside it', () => {
    expect(isInside({ root: ROOT, file: ROOT })).toBe(false);
  });

  it('a folder whose name only starts the same is not inside', () => {
    expect(isInside({ root: ROOT, file: `${ROOT}-backup/step-1.jpg` })).toBe(false);
  });
});
