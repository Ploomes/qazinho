import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';
import { SPEECH } from '@/shared/components/molecules/SpeechBubble/constants';

/** Por quanto tempo um balão fica na tela: chegar, ser digitado e ser lido sem pressa. */
export function holdMsOf(text: string): number {
  const typing = Math.ceil(text.length / SPEECH.charsPerBeat) * SPEECH.beatMs;
  const reading = Math.min(
    ASSISTANT_TIP.maxHoldMs,
    Math.max(ASSISTANT_TIP.minHoldMs, text.length * ASSISTANT_TIP.holdPerCharMs),
  );

  return ASSISTANT_TIP.speakAfterMs + typing + reading;
}
