import type { ISourceCheck } from './types';
import type {
  ICodeSource,
  ISourceChange,
  ISourcesCheckAsk,
  ISourcesChecked,
  ISourceSnapshot,
} from '@/shared/types';
import { SOURCE_CHECK } from './constants';
import { filesOfCompare, isSameText, shaOfBranch } from './library';

/**
 * Confere, sem IA, se as fontes de um plano mudaram depois que ele foi escrito: a
 * história, a página e a branch, cada uma lida de novo como o QA a lê.
 */
export class SourceCheck {
  private readonly ports: ISourceCheck;

  public constructor(ports: ISourceCheck) {
    this.ports = ports;
  }

  /** O que mudou em cada fonte, como cada uma está agora, e as que não deu para ler. */
  public async check(ask: ISourcesCheckAsk): Promise<ISourcesChecked> {
    const [read, code] = await Promise.all([
      Promise.all(
        ask.snapshots.map((snapshot) => this.snapshot({ snapshot, skip: ask.posted })),
      ),
      ask.code === null ? Promise.resolve(null) : this.code(ask.code),
    ]);

    return {
      changes: [
        ...read.flatMap(({ change }) => (change === null ? [] : [change])),
        ...(code?.change === null || code === null ? [] : [code.change]),
      ],
      snapshots: read.map(({ now }) => now),
      code: code?.now ?? ask.code,
      missed: [
        ...read.flatMap(({ missed }) => (missed === null ? [] : [missed])),
        ...(code?.missed == null ? [] : [code.missed]),
      ],
    };
  }

  private async snapshot(props: { snapshot: ISourceSnapshot; skip: string[] }): Promise<{
    change: ISourceChange | null;
    now: ISourceSnapshot;
    missed: string | null;
  }> {
    const { snapshot } = props;
    const at = new Date().toISOString();

    if (snapshot.kind === 'page') {
      const read = await this.ports.readPage(snapshot.pageId);

      if (!read.isRead) return { change: null, now: snapshot, missed: snapshot.title };

      const isSame = isSameText({ before: snapshot.text, after: read.text });

      return {
        change: isSame
          ? null
          : {
              kind: 'page',
              title: read.page.title,
              url: read.page.url,
              at,
              before: snapshot.text,
              after: read.text,
            },
        now: isSame
          ? snapshot
          : { ...snapshot, title: read.page.title, text: read.text, at },
        missed: null,
      };
    }

    const [read, comments] = await Promise.all([
      this.ports.readStory(snapshot.key),
      this.ports.readComments({
        key: snapshot.key,
        since: snapshot.at,
        skip: props.skip,
      }),
    ]);

    if (!read.isRead) return { change: null, now: snapshot, missed: snapshot.key };

    const after = this.ports.storyTextOf(read.story);
    const said = comments ?? [];
    const isSame = isSameText({ before: snapshot.text, after }) && said.length === 0;

    return {
      change: isSame
        ? null
        : {
            kind: 'story',
            key: snapshot.key,
            url: snapshot.url,
            at,
            before: snapshot.text,
            after,
            comments: said,
          },
      now: isSame ? snapshot : { ...snapshot, text: after, at },
      missed: null,
    };
  }

  private async code(code: ICodeSource): Promise<{
    change: ISourceChange | null;
    now: ICodeSource;
    missed: string | null;
  }> {
    const branch = await this.ports.githubApi(
      `repos/${code.repository}/branches/${encodeURIComponent(code.branch)}`,
    );
    const head = branch.isOk ? shaOfBranch(branch.text) : null;

    if (head === null) return { change: null, now: code, missed: code.branch };

    if (head === code.commit) return { change: null, now: code, missed: null };

    const compared = await this.ports.githubApi(
      `repos/${code.repository}/compare/${code.commit}...${head}`,
    );

    return {
      change: {
        kind: 'code',
        repository: code.repository,
        branch: code.branch,
        from: code.commit,
        to: head,
        files: compared.isOk
          ? filesOfCompare({
              text: compared.text,
              files: SOURCE_CHECK.files,
              patchLines: SOURCE_CHECK.patchLines,
            })
          : [],
      },
      now: { ...code, commit: head },
      missed: null,
    };
  }
}
