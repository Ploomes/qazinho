import type { IWindowDock } from '@/shared/types';
import type { BrowserWindow } from 'electron';

/** A janela que se encosta, e quem ouve quando ela encosta ou volta. */
export interface IWindowDockProps {
  windowOf: () => BrowserWindow | null;
  onChange: (dock: IWindowDock | null) => void;
}
