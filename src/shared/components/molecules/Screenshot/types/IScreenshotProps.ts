export interface IScreenshotProps {
  label: string;
  src?: string | null;
  file?: string | null;
  onOpen?: () => void;
  isBad?: boolean;
  size?: 'thumb' | 'shot';
}
