import type { IActivityLine } from '@/modules/Chat/types';
import type {
  IDeviceStep,
  IScreenThumb,
  IViewportChoice,
  ViewportId,
} from '@/modules/Device/types';
import type { ILiveQuestion } from '@/modules/Workspace';
import type { InternMood } from '@/shared/components/atoms/Intern/types';
import type { QaReply } from '@/shared/types';
import type { useAnimationControls } from 'motion/react';

/**
 * O dispositivo sozinho, enchendo o app: a tela, em que o agente está, e os controles da
 * run.
 */
export interface IDeviceFocusProps {
  isPhone: boolean;
  railLabel: string;
  screens: IScreenThumb[];
  swap: ReturnType<typeof useAnimationControls>;
  pickedNotice: string | null;
  onPickScreen: (id: number) => void;
  onFollowAgent: () => void;
  shot: string | null;
  stream: string | null;
  isLive: boolean;
  elapsedLabel: string;
  urlText: string;
  stateText: string;
  mood: InternMood;
  steps: IDeviceStep[];
  doingLabel: string;
  doingNow: IActivityLine | null;
  stepsWord: string;
  hasControls: boolean;
  pauseLabel: string;
  viewports: IViewportChoice[];
  ratio: number;
  onSelectViewport: (viewportId: ViewportId) => void;
  onPause: () => void;
  onStop: () => void;
  onClose: () => void;
  question: { key: string; live: ILiveQuestion } | null;
  onAnswerQuestion: (reply: QaReply) => void;
}
