import type { IUsageRow, UsageMetric, UsageSplit } from '@/modules/Usage/types';
import type { IUsageRecord } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_MODEL,
  USAGE_AGENT_NAMES,
  USAGE_KIND_LABELS,
  USAGE_PERIODS,
} from '@/modules/Usage/constants';
import {
  chartTicksOf,
  dayKeyOf,
  modelNameOf,
  periodStartOf,
  usageDaysOf,
  usageRowsOf,
  usageTotalsOf,
} from '@/modules/Usage/library';
import { USAGE_SCREEN } from '@/modules/Usage/screens/Usage/constants';
import { Usage } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useUsageViewModel = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const projects = useAppStore((state) => state.projects);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const [days, setDays] = useState<number>(30);
  const [metric, setMetric] = useState<UsageMetric>('cost');
  const [split, setSplit] = useState<UsageSplit>('kind');
  const [read, setRead] = useState<{ records: IUsageRecord[]; at: number } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const at = Date.now();

    void Usage.read(periodStartOf({ days, now: at })).then((records) => {
      if (isCurrent) setRead({ records, at });
    });

    return () => {
      isCurrent = false;
    };
  }, [days]);

  const records = read?.records ?? [];
  const totals = usageTotalsOf(records);
  const shown: UsageMetric = totals.hasCost ? metric : 'tokens';
  const dollars = (value: number) =>
    new Intl.NumberFormat(language, { style: 'currency', currency: 'USD' }).format(value);
  const money = (value: number) =>
    value > 0 && value < 0.005 ? `< ${dollars(0.01)}` : dollars(value);
  const compact = (value: number) =>
    new Intl.NumberFormat(language, {
      notation: value < 10_000 ? 'standard' : 'compact',
      maximumFractionDigits: value < 10_000 ? 0 : 2,
    }).format(value);
  const percent = (value: number) =>
    new Intl.NumberFormat(language, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  const dayLabel = (day: string) => {
    const [year = 0, month = 1, date = 1] = day.split('-').map(Number);

    return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(
      new Date(year, month - 1, date),
    );
  };
  const amountOf = (row: { costUsd: number | null; tokens: number }) =>
    shown === 'cost'
      ? row.costUsd === null
        ? t('USAGE_SCREEN.NO_COST')
        : money(row.costUsd)
      : t('USAGE_SCREEN.TOKEN_TOTAL', { tokens: compact(row.tokens) });
  const total = shown === 'cost' ? totals.costUsd : totals.tokens;
  const shareOf = (row: IUsageRow) => {
    const part = shown === 'cost' ? (row.costUsd ?? 0) : row.tokens;

    return total > 0 ? part / total : 0;
  };
  const projectKeyOf = (record: IUsageRecord) =>
    record.projectId ??
    workspaces.find((workspace) => workspace.id === record.workspaceId)?.projectId ??
    '';
  const splits: Record<
    UsageSplit,
    { keyOf: (record: IUsageRecord) => string; nameOf: (key: string) => string }
  > = {
    kind: {
      keyOf: (record) => record.kind,
      nameOf: (key) => t(USAGE_KIND_LABELS[key as IUsageRecord['kind']]),
    },
    project: {
      keyOf: projectKeyOf,
      nameOf: (key) =>
        projects.find((project) => project.id === key)?.name ??
        t(key === '' ? 'USAGE_SCREEN.NO_PROJECT' : 'USAGE_SCREEN.GONE_PROJECT'),
    },
    model: {
      keyOf: (record) =>
        record.model === '' ? `${DEFAULT_MODEL}${record.agentId}` : record.model,
      nameOf: (key) =>
        key.startsWith(DEFAULT_MODEL)
          ? t('USAGE_SCREEN.DEFAULT_MODEL', {
              agent:
                USAGE_AGENT_NAMES[key.slice(DEFAULT_MODEL.length)] ??
                key.slice(DEFAULT_MODEL.length),
            })
          : (modelNameOf(key) ?? key),
    },
    day: { keyOf: (record) => dayKeyOf(record.at), nameOf: dayLabel },
  };
  const chosen = splits[split];
  const rows = usageRowsOf({ records, keyOf: chosen.keyOf, metric: shown });
  const dailies = read === null ? [] : usageDaysOf({ records, days, now: read.at });
  const values = dailies.map((day) => (shown === 'cost' ? day.costUsd : day.tokens));
  const ticks = chartTicksOf({
    max: Math.max(0, ...values),
    count: USAGE_SCREEN.tickCount,
  });
  const top = ticks[ticks.length - 1] ?? 1;
  const last = dailies.length - 1;
  const labelled = new Set([0, Math.floor(last / 2), last]);

  return {
    title: t('USAGE_SCREEN.TITLE'),
    style: {
      '--usage-column': `${String(USAGE_SCREEN.columnPx)}px`,
      '--usage-chart-height': `${String(USAGE_SCREEN.chartHeightPx)}px`,
      '--usage-bar-max': `${String(USAGE_SCREEN.barMaxPx)}px`,
    } as CSSProperties,
    period: {
      label: t('USAGE_SCREEN.PERIOD'),
      value: String(days),
      options: USAGE_PERIODS.map((count) => ({
        id: String(count),
        label: t('USAGE_SCREEN.DAYS', { count }),
      })),
      onChange: (id: string) => {
        setDays(Number(id));
      },
    },
    metric: {
      isShown: totals.hasCost,
      label: t('USAGE_SCREEN.METRIC'),
      value: shown,
      options: [
        { id: 'cost', label: t('USAGE_SCREEN.COST') },
        { id: 'tokens', label: t('USAGE_SCREEN.TOKENS') },
      ],
      onChange: (id: string) => {
        setMetric(id === 'tokens' ? 'tokens' : 'cost');
      },
    },
    isLoading: read === null,
    isEmpty: read !== null && records.length === 0,
    empty: t('USAGE_SCREEN.EMPTY'),
    hero: {
      value: shown === 'cost' ? dollars(totals.costUsd) : compact(totals.tokens),
      note: t(shown === 'cost' ? 'USAGE_SCREEN.ESTIMATE' : 'USAGE_SCREEN.TOKENS_NOTE'),
      unpriced:
        shown === 'cost' && totals.hasUnpriced ? t('USAGE_SCREEN.UNPRICED') : null,
    },
    agents: usageRowsOf({
      records,
      keyOf: (record) => record.agentId,
      metric: shown,
    }).map((row) => ({
      key: row.key,
      name: USAGE_AGENT_NAMES[row.key] ?? row.key,
      amount: amountOf(row),
      detail:
        shown === 'tokens'
          ? percent(shareOf(row))
          : row.costUsd === null
            ? t('USAGE_SCREEN.TOKEN_TOTAL', { tokens: compact(row.tokens) })
            : `${percent(shareOf(row))} · ${t('USAGE_SCREEN.TOKEN_TOTAL', { tokens: compact(row.tokens) })}`,
    })),
    chart: {
      title: t(
        shown === 'cost' ? 'USAGE_SCREEN.DAILY_COST' : 'USAGE_SCREEN.DAILY_TOKENS',
      ),
      action: t('USAGE_SCREEN.SEE_DAYS'),
      onAction: () => {
        setSplit('day');
      },
      ticks: ticks.map((tick) => ({
        key: String(tick),
        label: shown === 'cost' ? dollars(tick) : compact(tick),
        style: { '--usage-tick': `${String((tick / top) * 100)}%` } as CSSProperties,
      })),
      bars: dailies.map((day, index) => {
        const value = values[index] ?? 0;

        return {
          key: day.day,
          tip: t('USAGE_SCREEN.DAY_TIP', {
            day: dayLabel(day.day),
            amount: amountOf(day),
          }),
          className:
            value > 0 ? 'usage-chart__bar usage-chart__bar--spent' : 'usage-chart__bar',
          style: { '--usage-bar': `${String((value / top) * 100)}%` } as CSSProperties,
        };
      }),
      days: dailies
        .map((day, index) => ({ day, index }))
        .filter(({ index }) => labelled.has(index))
        .map(({ day, index }) => ({
          key: day.day,
          label: dayLabel(day.day),
          style: {
            '--usage-day': `${String(((index + 0.5) / dailies.length) * 100)}%`,
          } as CSSProperties,
        })),
    },
    totals: {
      title: t('USAGE_SCREEN.TOTALS'),
      tiles: [
        { key: 'input', label: t('USAGE_SCREEN.INPUT'), value: compact(totals.input) },
        { key: 'output', label: t('USAGE_SCREEN.OUTPUT'), value: compact(totals.output) },
        {
          key: 'read',
          label: t('USAGE_SCREEN.CACHE_READ'),
          value: compact(totals.cacheRead),
        },
        {
          key: 'write',
          label: t('USAGE_SCREEN.CACHE_WRITE'),
          value: compact(totals.cacheWrite),
        },
      ],
    },
    split: {
      label: t('USAGE_SCREEN.SPLIT'),
      value: split,
      options: [
        { id: 'kind', label: t('USAGE_SCREEN.BY_KIND') },
        { id: 'project', label: t('USAGE_SCREEN.BY_PROJECT') },
        { id: 'model', label: t('USAGE_SCREEN.BY_MODEL') },
        { id: 'day', label: t('USAGE_SCREEN.BY_DAY') },
      ],
      onChange: (id: string) => {
        setSplit(id === 'project' || id === 'model' || id === 'day' ? id : 'kind');
      },
      columns: {
        name: t(
          split === 'kind'
            ? 'USAGE_SCREEN.BY_KIND'
            : split === 'project'
              ? 'USAGE_SCREEN.BY_PROJECT'
              : split === 'model'
                ? 'USAGE_SCREEN.BY_MODEL'
                : 'USAGE_SCREEN.BY_DAY',
        ),
        cost: t('USAGE_SCREEN.COL_COST'),
        share: t('USAGE_SCREEN.COL_SHARE'),
        tokens: t('USAGE_SCREEN.COL_TOKENS'),
      },
      rows: (split === 'day'
        ? [...rows].sort((first, second) => second.key.localeCompare(first.key))
        : rows
      ).map((row) => ({
        key: row.key,
        name: chosen.nameOf(row.key),
        cost: row.costUsd === null ? t('USAGE_SCREEN.NO_COST') : money(row.costUsd),
        share: percent(shareOf(row)),
        shareStyle: {
          '--usage-share': `${String(shareOf(row) * 100)}%`,
        } as CSSProperties,
        tokens: compact(row.tokens),
      })),
    },
  };
};
