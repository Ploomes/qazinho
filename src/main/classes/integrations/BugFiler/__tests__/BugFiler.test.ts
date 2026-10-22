import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';
import type { JiraFiled } from '@/main/classes/integrations/JiraApi/types';
import type { IFileBug, IFilingEvent } from '@/shared/types';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BugFiler } from '@/main/classes/integrations/BugFiler';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 3]);
const AT = new Date('2026-10-22T12:00:00.000Z');

const REPORT = {
  title: 'Coupon refused',
  blocks: [{ kind: 'paragraph' as const, text: 'SAVE10 is refused.' }],
};

/** A Jira that files as told, and remembers every file it was handed and every link. */
function fakeJira(
  props: { filed?: JiraFiled; refuses?: string[]; links?: boolean } = {},
) {
  const attached: { key: string; name: string; type: string; size: number }[] = [];
  const related: { key: string; to: string }[] = [];

  return {
    attached,
    related,
    jira: {
      fileBug: () =>
        Promise.resolve(
          props.filed ?? {
            isFiled: true as const,
            key: 'SHOP-57',
            url: 'https://acme.atlassian.net/browse/SHOP-57',
          },
        ),
      attach: (file: { key: string; name: string; type: string; bytes: Uint8Array }) => {
        if (props.refuses?.includes(file.name) === true) return Promise.resolve(false);

        attached.push({
          key: file.key,
          name: file.name,
          type: file.type,
          size: file.bytes.length,
        });

        return Promise.resolve(true);
      },
      relate: (link: { key: string; to: string }) => {
        related.push(link);

        return Promise.resolve(props.links ?? true);
      },
    },
  };
}

/** A gh that answers each path as told, and remembers what it was asked. */
function fakeGh(answers: Record<string, GhAnswer>) {
  const asked: { path: string; method?: string; fields?: Record<string, string> }[] = [];

  return {
    asked,
    github: {
      api: (request: {
        path: string;
        method?: 'POST';
        fields?: Record<string, string>;
      }) => {
        asked.push(request);

        return Promise.resolve(
          answers[request.path] ?? {
            isOk: false as const,
            failure: 'not-found' as const,
            httpStatus: 404,
            said: 'gh: Not Found (HTTP 404)',
          },
        );
      },
    },
  };
}

function filer(props: {
  jira?: ReturnType<typeof fakeJira>['jira'];
  github?: ReturnType<typeof fakeGh>['github'];
  recording?: string | null;
}) {
  const events: IFilingEvent[] = [];

  return {
    events,
    filer: new BugFiler({
      jira: props.jira ?? fakeJira().jira,
      github: props.github ?? fakeGh({}).github,
      readShot: (shot) =>
        Promise.resolve(
          shot.file === 'before' ? JPEG : shot.file === 'broke' ? PNG : null,
        ),
      recordingOf: () => Promise.resolve(props.recording ?? null),
      onEvent: (event) => events.push(event),
      now: () => AT,
    }),
  };
}

const TO_JIRA: IFileBug = {
  filingId: 'f-1',
  target: { tracker: 'jira', project: 'SHOP' },
  story: 'SHOP-12',
  report: REPORT,
  shots: [
    { name: 'BUG-02 before', file: 'before', src: null },
    { name: 'BUG-02 broke', file: 'broke', src: null },
  ],
  video: { kind: 'clip', name: 'BUG-02 clip', data: new Uint8Array([7, 7, 7]) },
};

describe('BugFiler', () => {
  describe('to Jira', () => {
    it('files the issue, attaches each screen by what its bytes are and the clip, and links the story', async () => {
      const jira = fakeJira();
      const { filer: bugs, events } = filer({ jira: jira.jira });

      expect(await bugs.file(TO_JIRA)).toEqual({
        isFiled: true,
        issue: {
          tracker: 'jira',
          key: 'SHOP-57',
          url: 'https://acme.atlassian.net/browse/SHOP-57',
          at: AT.toISOString(),
        },
        missed: [],
        linked: 'SHOP-12',
      });
      expect(jira.attached).toEqual([
        { key: 'SHOP-57', name: 'BUG-02 before.jpg', type: 'image/jpeg', size: 4 },
        { key: 'SHOP-57', name: 'BUG-02 broke.png', type: 'image/png', size: 6 },
        { key: 'SHOP-57', name: 'BUG-02 clip.mp4', type: 'video/mp4', size: 3 },
      ]);
      expect(jira.related).toEqual([{ key: 'SHOP-57', to: 'SHOP-12' }]);
      expect(events.map(({ step, state }) => `${step} ${state}`)).toEqual([
        'issue working',
        'issue done',
        'screens working',
        'screens done',
        'video working',
        'video done',
        'link working',
        'link done',
      ]);
    });

    it('stays filed when a file or the link did not go, and says which', async () => {
      const jira = fakeJira({ refuses: ['BUG-02 clip.mp4'], links: false });
      const { filer: bugs, events } = filer({ jira: jira.jira });
      const filed = await bugs.file({
        ...TO_JIRA,
        shots: [...TO_JIRA.shots, { name: 'BUG-02 lost', file: 'gone', src: null }],
      });

      expect(filed).toMatchObject({
        isFiled: true,
        missed: ['BUG-02 lost', 'BUG-02 clip.mp4'],
        linked: null,
      });
      expect(
        events.filter(({ state }) => state === 'failed').map(({ step }) => step),
      ).toEqual(['video', 'link']);
    });

    it('does NOT attach anything when Jira refused the issue, and says why in its words', async () => {
      const jira = fakeJira({
        filed: { isFiled: false, failure: 'rejected', said: 'Component/s is required.' },
      });
      const { filer: bugs, events } = filer({ jira: jira.jira });

      expect(await bugs.file(TO_JIRA)).toEqual({
        isFiled: false,
        failure: 'rejected',
        said: 'Component/s is required.',
      });
      expect(jira.attached).toEqual([]);
      expect(events.at(-1)).toEqual({ filingId: 'f-1', step: 'issue', state: 'failed' });
    });

    it('attaches a phone’s whole recording, and none past the size Jira is sent', async () => {
      const folder = await mkdtemp(join(tmpdir(), 'qazinho-filer-'));
      const small = join(folder, 'run.webm');

      await writeFile(small, Buffer.alloc(10));

      const jira = fakeJira();
      const recording = {
        kind: 'recording' as const,
        name: 'r-03 recording',
        run: { workspaceId: 'w-1', runId: 'r-03' },
      };

      await filer({ jira: jira.jira, recording: small }).filer.file({
        ...TO_JIRA,
        shots: [],
        story: null,
        video: recording,
      });

      expect(jira.attached).toEqual([
        { key: 'SHOP-57', name: 'r-03 recording.webm', type: 'video/webm', size: 10 },
      ]);

      const big = join(folder, 'run.mp4');

      await writeFile(big, Buffer.alloc(25 * 1024 * 1024 + 1));

      const later = fakeJira();

      expect(
        await filer({ jira: later.jira, recording: big }).filer.file({
          ...TO_JIRA,
          shots: [],
          story: null,
          video: recording,
        }),
      ).toMatchObject({ isFiled: true, missed: ['r-03 recording'] });
      expect(later.attached).toEqual([]);
    });
  });

  describe('to GitHub', () => {
    const TO_GITHUB: IFileBug = {
      ...TO_JIRA,
      target: { tracker: 'github', owner: 'acme', name: 'shop' },
      story: null,
      shots: [],
      video: null,
    };
    const CREATED: GhAnswer = {
      isOk: true,
      text: JSON.stringify({
        number: 42,
        html_url: 'https://github.com/acme/shop/issues/42',
      }),
    };

    it('opens the issue in Markdown, labelled a bug where the repository has the label', async () => {
      const gh = fakeGh({
        'repos/acme/shop/labels/bug': { isOk: true, text: '{"name":"bug"}' },
        'repos/acme/shop/issues': CREATED,
      });
      const { filer: bugs } = filer({ github: gh.github });

      expect(await bugs.file(TO_GITHUB)).toEqual({
        isFiled: true,
        issue: {
          tracker: 'github',
          key: '#42',
          url: 'https://github.com/acme/shop/issues/42',
          at: AT.toISOString(),
        },
        missed: [],
        linked: null,
      });
      expect(gh.asked.at(-1)).toEqual({
        path: 'repos/acme/shop/issues',
        method: 'POST',
        fields: {
          title: 'Coupon refused',
          body: 'SAVE10 is refused.',
          'labels[]': 'bug',
        },
      });
    });

    it('does NOT ask for a label the repository does not have', async () => {
      const gh = fakeGh({ 'repos/acme/shop/issues': CREATED });

      await filer({ github: gh.github }).filer.file(TO_GITHUB);

      expect(gh.asked.at(-1)?.fields).toEqual({
        title: 'Coupon refused',
        body: 'SAVE10 is refused.',
      });
    });

    it('says why GitHub refused the issue', async () => {
      const gh = fakeGh({
        'repos/acme/shop/issues': {
          isOk: false,
          failure: 'unexpected',
          httpStatus: 410,
          said: 'gh: Issues are disabled for this repo (HTTP 410)',
        },
      });

      expect(await filer({ github: gh.github }).filer.file(TO_GITHUB)).toEqual({
        isFiled: false,
        failure: 'rejected',
        said: 'gh: Issues are disabled for this repo (HTTP 410)',
      });
    });
  });
});
