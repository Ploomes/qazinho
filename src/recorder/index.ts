import { FrameRecorder } from '@/recorder/classes';

const recorders = new Map<string, FrameRecorder>();
const api = window.qazinhoRecorder;

api.onStart((start) => {
  const recorder = new FrameRecorder({ id: start.id, url: start.url, send: api.write });

  recorders.set(start.id, recorder);
  void recorder.start();
});

api.onStop((stop) => {
  const recorder = recorders.get(stop.id);

  recorders.delete(stop.id);
  void (recorder?.stop(stop.at) ?? Promise.resolve(null)).then((video) => {
    api.done({ id: stop.id, video });
  });
});
