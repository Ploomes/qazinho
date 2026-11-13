import type {
  ChangeReading,
  IReadChange,
  ISourcesCheckAsk,
  ISourcesChecked,
} from '@/shared/types';

/** O único que chama o lado das fontes de um plano da bridge. */
export class Sources {
  public static async check(ask: ISourcesCheckAsk): Promise<ISourcesChecked> {
    return (
      (await window.qazinho?.checkSources(ask)) ?? {
        changes: [],
        snapshots: ask.snapshots,
        code: ask.code,
        missed: [
          ...ask.snapshots.map((one) => (one.kind === 'story' ? one.key : one.title)),
          ...(ask.code === null ? [] : [ask.code.branch]),
        ],
      }
    );
  }

  public static async read(request: IReadChange): Promise<ChangeReading> {
    return (
      (await window.qazinho?.readChange(request)) ?? {
        isRead: false,
        reason: 'agent-missing',
      }
    );
  }
}
