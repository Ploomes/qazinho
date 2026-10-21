import { describe, expect, it } from 'vitest';
import { jsonLinesOf } from '@/main/classes/integrations/GithubRepos/library';

describe('jsonLinesOf', () => {
  it('reads one JSON value per line', () => {
    expect(jsonLinesOf('{"a":1}\n{"a":2}\n')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('leaves out blank lines and lines that are not JSON', () => {
    expect(jsonLinesOf('\n{"a":1}\nnot json\n  \n')).toEqual([{ a: 1 }]);
  });
});
