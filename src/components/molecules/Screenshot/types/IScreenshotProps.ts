export interface IScreenshotProps {
  label: string;
  onOpen?: () => void;
  isBad?: boolean;
  size?: 'thumb' | 'shot';
}
