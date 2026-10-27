/**
 * A line someone on screen says, typed out as it streams; `onSaid` fires once it is all
 * there.
 */
export interface ISpeechBubbleProps {
  text: string;
  onSaid?: () => void;
}
