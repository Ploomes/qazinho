export interface IIconButtonProps {
  glyph: string;
  label: string;
  onClick: () => void;
  size?: 'sm' | 'md';
  isActive?: boolean;
}
