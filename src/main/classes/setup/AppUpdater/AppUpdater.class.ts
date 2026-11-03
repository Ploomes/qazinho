import type { IAppUpdater, IUpdaterPort } from './types';
import type { AppUpdate } from '@/shared/types';
import { APP_UPDATE } from './constants';

/**
 * Mantém o app atualizado: procura de tempos em tempos e baixa em segundo plano. Quando a
 * API recusa esta versão, a atualização vira obrigatória e ele insiste até conseguir.
 */
export class AppUpdater {
  private readonly port: IUpdaterPort;
  private readonly isAvailable: boolean;
  private readonly onChange: (update: AppUpdate) => void;
  private readonly log: (message: string) => void;
  private update: AppUpdate = { phase: 'idle', isRequired: false };
  private isListening = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  public constructor(props: IAppUpdater) {
    this.port = props.port;
    this.isAvailable = props.isAvailable;
    this.onChange = props.onChange;
    this.log = props.log;
  }

  /** Começa a procurar, logo ao abrir e de tempos em tempos, onde dá para atualizar. */
  public start(): void {
    if (!this.isAvailable) return;

    this.listen();
    this.timers.push(
      setTimeout(() => void this.check(), APP_UPDATE.firstCheckMs),
      setInterval(() => void this.check(), APP_UPDATE.everyMs),
    );
  }

  /** Em que pé a atualização está agora. */
  public state(): AppUpdate {
    return this.update;
  }

  /** Torna a atualização obrigatória e procura na hora, e de novo a cada minuto. */
  public require(): void {
    if (this.update.isRequired) return;

    if (!this.isAvailable) {
      this.change({ phase: 'failed', isRequired: true });

      return;
    }

    this.change({ ...this.update, isRequired: true });
    this.listen();
    this.timers.push(setInterval(() => void this.check(), APP_UPDATE.requiredEveryMs));
    void this.check();
  }

  /** Fecha o app e instala a versão baixada, e não faz nada enquanto não há uma. */
  public install(): void {
    if (this.update.phase === 'ready') this.port.install();
  }

  /** Para de procurar. */
  public stop(): void {
    for (const timer of this.timers) clearTimeout(timer);

    this.timers = [];
  }

  private listen(): void {
    if (this.isListening) return;

    this.isListening = true;
    this.port.listen({
      available: (version) => {
        this.change({
          phase: 'downloading',
          version,
          percent: 0,
          isRequired: this.update.isRequired,
        });
      },
      progress: (percent) => {
        const rounded = Math.floor(percent);

        if (this.update.phase === 'downloading' && rounded !== this.update.percent)
          this.change({ ...this.update, percent: rounded });
      },
      downloaded: (version) => {
        this.change({ phase: 'ready', version, isRequired: this.update.isRequired });
      },
      nothing: () => {
        this.settle();
      },
      failed: (message) => {
        this.log(message);
        this.settle();
      },
    });
  }

  private settle(): void {
    if (this.update.phase === 'ready') return;

    this.change(
      this.update.isRequired
        ? { phase: 'failed', isRequired: true }
        : { phase: 'idle', isRequired: false },
    );
  }

  private async check(): Promise<void> {
    if (this.update.phase === 'downloading' || this.update.phase === 'ready') return;

    await this.port.check().catch((reason: unknown) => {
      this.log(String(reason));
      this.settle();
    });
  }

  private change(update: AppUpdate): void {
    this.update = update;
    this.onChange(update);
  }
}
