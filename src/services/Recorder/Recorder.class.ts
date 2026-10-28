import { FrameRecorder } from './classes';

/**
 * O lado da bridge da janela do gravador: um gravador de frames por run que a main
 * inicia.
 */
export class Recorder {
  private static readonly recorders = new Map<string, FrameRecorder>();

  /** Grava cada run que a main inicia, e devolve o vídeo dela quando a main a para. */
  public static listen(): void {
    const api = window.qazinhoRecorder;

    api.onStart((start) => {
      const recorder = new FrameRecorder({
        id: start.id,
        url: start.url,
        send: api.write,
      });

      Recorder.recorders.set(start.id, recorder);
      void recorder.start();
    });

    api.onStop((stop) => {
      const recorder = Recorder.recorders.get(stop.id);

      Recorder.recorders.delete(stop.id);
      void (recorder?.stop(stop.at) ?? Promise.resolve(null)).then((video) => {
        api.done({ id: stop.id, video });
      });
    });
  }
}
