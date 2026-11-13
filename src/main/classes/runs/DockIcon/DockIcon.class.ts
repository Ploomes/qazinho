import type {
  DockIconKind,
  IDockIcon,
  IDockImages,
  IDockTally,
  IDockView,
} from '@/main/classes/runs/DockIcon/types';
import type { IRunEvent } from '@/shared/types';
import type { NativeImage } from 'electron';
import { app, nativeImage } from 'electron';
import { DOCK_ICON, EMPTY_DOCK_TALLY } from '@/main/classes/runs/DockIcon/constants';
import {
  withDockEvent,
  withDockRun,
  withoutDockResult,
  dockViewOf,
} from '@/main/classes/runs/DockIcon/library';

/**
 * O ícone do app na Dock: muda conforme o estado da run, mostra o progresso e deixa o
 * resultado como um badge até o QA voltar.
 */
export class DockIcon {
  private readonly props: IDockIcon;
  private tally: IDockTally = EMPTY_DOCK_TALLY;
  private unseen = 0;
  private images: IDockImages | null = null;
  private shown: DockIconKind | null = null;
  private timer: NodeJS.Timeout | null = null;
  private frameIndex = 0;

  public constructor(props: IDockIcon) {
    this.props = props;
  }

  /** Uma run começou: o ícone vai a "rodando" e o resultado da rodada anterior some. */
  public begin(props: { workspaceId: string; total: number }): void {
    if (!this.dock()) return;

    this.apply(withDockRun({ tally: this.tally, ...props }));
  }

  /** Um evento de run: um passo que anda a barra, uma pergunta, ou o fim da run. */
  public handle(event: IRunEvent): void {
    if (!this.dock()) return;

    this.apply(withDockEvent({ tally: this.tally, event }));
  }

  /** Quantas perguntas e runs esperam o QA, que o badge mostra sem um resultado. */
  public alerts(unseen: number): void {
    if (!this.dock()) {
      app.setBadgeCount(unseen);

      return;
    }

    this.unseen = unseen;
    this.render(dockViewOf({ tally: this.tally, unseen }));
  }

  /** O QA voltou ao app: o resultado da rodada some do ícone. */
  public seen(): void {
    if (!this.dock()) return;

    this.apply(withoutDockResult(this.tally));
  }

  /** Devolve o ícone original e tira a barra, quando o app sai. */
  public dispose(): void {
    if (!this.dock()) return;

    this.show(null);
    this.props.window()?.setProgressBar(-1);
  }

  private apply(next: IDockTally): void {
    const before = this.tally;

    this.tally = next;
    this.render(dockViewOf({ tally: next, unseen: this.unseen }));

    const finishedBad =
      before.result === null && (next.result === 'bug' || next.result === 'broken');

    if (finishedBad && this.props.isAway()) this.dock()?.bounce('critical');
  }

  private render(view: IDockView): void {
    this.props.window()?.setProgressBar(view.progress ?? -1);
    this.dock()?.setBadge(view.badge);
    this.show(view.icon);
  }

  private show(kind: DockIconKind | null): void {
    const dock = this.dock();

    if (!dock || kind === this.shown) return;

    this.stopAnimation();

    const { original, states, frames } = this.load();

    if (kind === 'running' && frames.length > 0) this.startAnimation(frames);
    else dock.setIcon(kind === null ? original : states[kind]);

    this.shown = kind;
  }

  private startAnimation(frames: NativeImage[]): void {
    this.frameIndex = 0;
    this.showFrame(frames);
    this.timer = setInterval(() => {
      this.showFrame(frames);
    }, DOCK_ICON.frameMs);
  }

  private stopAnimation(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = null;
  }

  private showFrame(frames: NativeImage[]): void {
    const frame = frames[this.frameIndex % frames.length];

    if (frame) this.dock()?.setIcon(frame);

    this.frameIndex += 1;
  }

  private load(): IDockImages {
    this.images ??= {
      original: nativeImage.createFromPath(this.props.icon),
      frames: this.props.frames.map((file) => nativeImage.createFromPath(file)),
      states: {
        running: nativeImage.createFromPath(this.props.states.running),
        thinking: nativeImage.createFromPath(this.props.states.thinking),
        passed: nativeImage.createFromPath(this.props.states.passed),
        bug: nativeImage.createFromPath(this.props.states.bug),
        broken: nativeImage.createFromPath(this.props.states.broken),
      },
    };

    return this.images;
  }

  private dock(): NonNullable<typeof app.dock> | null {
    return process.platform === 'darwin' ? (app.dock ?? null) : null;
  }
}
