import type { CSSProperties } from 'react';

/** O gasto de cada dia em colunas: as marcas do eixo, as colunas e os dias nomeados. */
export interface IUsageChartProps {
  title: string;
  action: string;
  onAction: () => void;
  ticks: { key: string; label: string; style: CSSProperties }[];
  bars: { key: string; tip: string; className: string; style: CSSProperties }[];
  days: { key: string; label: string; style: CSSProperties }[];
}
