/**
 * Uma fala de alguém na tela, digitada enquanto chega; `onSaid` dispara quando ela está
 * toda lá.
 */
export interface ISpeechBubbleProps {
  text: string;
  onSaid?: () => void;
}
