import type { IconName } from './IconName';

/**
 * An icon by its name, as tall as the text around it unless sized, solid when it marks
 * what is on, and read aloud only with a label.
 */
export interface IIconProps {
  name: IconName;
  size?: number;
  isFilled?: boolean;
  label?: string;
}
