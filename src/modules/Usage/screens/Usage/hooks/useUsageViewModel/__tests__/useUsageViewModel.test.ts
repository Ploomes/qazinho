// @vitest-environment jsdom
import type { IUsageRecord } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { spend } from '@/modules/Usage/library/__tests__/fixtures';
import { useUsageViewModel } from '@/modules/Usage/screens/Usage/hooks/useUsageViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const now = Date.now();

/** O Intl separa a moeda e o "mi" com um espaço que não quebra. */
const plain = (text: string) => text.replace(/\u00a0/g, ' ');

/** A bridge com estes gastos, e o momento desde quando a tela pediu. */
function bridgeWith(records: IUsageRecord[]) {
  const readUsage = vi.fn((sinceMs: number) =>
    Promise.resolve(records.filter((record) => record.at >= sinceMs)),
  );

  window.qazinho = { ...fakeQazinhoApi('darwin'), readUsage };

  return readUsage;
}

async function loaded() {
  const hook = renderHook(() => useUsageViewModel());

  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false);
  });

  return hook;
}

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  useAppStore.setState({
    projects: [{ id: 'p1', name: 'Loja Web', targets: [], repositories: [] }],
  });
  useWorkspaceStore.setState({ workspaces: [] });
});

describe('useUsageViewModel', () => {
  it('reads the last 30 days and leads with what they cost, at API prices', async () => {
    const readUsage = bridgeWith([
      spend({ at: now, costUsd: 12.5 }),
      spend({ at: now, costUsd: 24.21 }),
    ]);
    const { result } = await loaded();

    expect(readUsage.mock.calls[0]?.[0]).toBeLessThanOrEqual(now - 29 * 86_400_000);
    expect(plain(result.current.hero.value)).toBe('US$ 36,71');
    expect(result.current.hero.note).toBe('Estimado pelo preço da API');
    expect(result.current.chart.bars).toHaveLength(30);
  });

  it('reads again when the period changes', async () => {
    const readUsage = bridgeWith([spend({ at: now })]);
    const { result } = await loaded();

    act(() => {
      result.current.period.onChange('7');
    });

    await waitFor(() => {
      expect(result.current.chart.bars).toHaveLength(7);
    });
    expect(readUsage).toHaveBeenCalledTimes(2);
  });

  /** Só o Codex: ele não diz o custo, então a tela mede tokens e não oferece o custo. */
  it('measures tokens when no spend came with a price', async () => {
    bridgeWith([spend({ at: now, agentId: 'codex', costUsd: null, input: 1_200_000 })]);
    const { result } = await loaded();

    expect(result.current.metric.isShown).toBe(false);
    expect(plain(result.current.hero.value)).toBe('1,2 mi');
    expect(result.current.hero.note).toBe('Tokens processados');
  });

  it('says when part of the spend had no price', async () => {
    bridgeWith([spend({ at: now }), spend({ at: now, agentId: 'codex', costUsd: null })]);
    const { result } = await loaded();

    expect(result.current.hero.unpriced).toMatch(/sem preço/);
    expect(result.current.agents.map((agent) => agent.name)).toEqual([
      'Claude Code',
      'Codex',
    ]);
  });

  it('splits by work first, the costliest first, in the words of the QA', async () => {
    bridgeWith([
      spend({ at: now, kind: 'chat', costUsd: 1 }),
      spend({ at: now, kind: 'case', costUsd: 3 }),
    ]);
    const { result } = await loaded();

    expect(
      result.current.split.rows.map((row) => [
        row.name,
        plain(row.cost),
        plain(row.share),
      ]),
    ).toEqual([
      ['Casos das runs', 'US$ 3,00', '75,0%'],
      ['Chat dos planos', 'US$ 1,00', '25,0%'],
    ]);
  });

  it('names the project of a spend, through its plan when the spend did not say', async () => {
    useWorkspaceStore.setState({
      workspaces: [{ id: 'w9', projectId: 'p1' } as never],
    });
    bridgeWith([
      spend({ at: now, projectId: null, workspaceId: 'w9' }),
      spend({ at: now, projectId: null, workspaceId: null, kind: 'assistant' }),
      spend({ at: now, projectId: 'gone' }),
    ]);
    const { result } = await loaded();

    act(() => {
      result.current.split.onChange('project');
    });

    expect(result.current.split.rows.map((row) => row.name).sort()).toEqual([
      'Fora de um projeto',
      'Loja Web',
      'Projeto apagado',
    ]);
  });

  it('names a Claude model shortly and lists the days newest first', async () => {
    bridgeWith([spend({ at: now }), spend({ at: now - 86_400_000, model: '' })]);
    const { result } = await loaded();

    act(() => {
      result.current.split.onChange('model');
    });

    expect(result.current.split.rows.map((row) => row.name).sort()).toEqual([
      'Padrão do Claude Code',
      'Sonnet 5.5',
    ]);

    act(() => {
      result.current.chart.onAction();
    });

    expect(result.current.split.value).toBe('day');
    expect(result.current.split.rows).toHaveLength(2);
  });

  it('says plainly when nothing was spent', async () => {
    bridgeWith([]);
    const { result } = await loaded();

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.empty).toBe('Nenhuma chamada ao seu agente nestes dias.');
  });
});
