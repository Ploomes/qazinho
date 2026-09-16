export interface IScreenshotProps {
  label: string;
  src?: string | null;
  onOpen?: () => void;
  isBad?: boolean;
  size?: 'thumb' | 'shot';
}
