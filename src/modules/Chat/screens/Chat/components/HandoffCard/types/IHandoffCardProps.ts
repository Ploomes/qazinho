export interface IHandoffCardProps {
  glyph: string;
  title: string;
  subtitle: string;
  action: string;
  onOpen: () => void;
  isAccent?: boolean;
}
