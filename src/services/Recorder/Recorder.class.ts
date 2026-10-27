import { FrameRecorder } from './classes';

/** The recorder window's side of the bridge: one frame recorder per run main starts. */
export class Recorder {
  private static readonly recorders = new Map<string, FrameRecorder>();

  /** Records each run main starts, and hands its video back once main stops it. */
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
