import type { IDeviceStep, IViewportChoice, ViewportId } from '@/modules/Device/types';
import type { InternMood } from '@/shared/components/atoms/Intern/types';

/** The device on its own, filling the app: the screen, what the agent is on, and the run's controls. */
export interface IDeviceFocusProps {
  isPhone: boolean;
  shot: string | null;
  stream: string | null;
  isLive: boolean;
  elapsedLabel: string;
  urlText: string;
  stateText: string;
  mood: InternMood;
  steps: IDeviceStep[];
  doingLabel: string;
  stepsWord: string;
  hasControls: boolean;
  pauseLabel: string;
  viewports: IViewportChoice[];
  viewportNote: string;
  ratio: number;
  onSelectViewport: (viewportId: ViewportId) => void;
  onPause: () => void;
  onStop: () => void;
  onClose: () => void;
}
