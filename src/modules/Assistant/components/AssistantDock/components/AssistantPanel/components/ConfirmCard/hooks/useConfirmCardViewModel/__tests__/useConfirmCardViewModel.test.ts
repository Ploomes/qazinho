// @vitest-environment jsdom
import type { IAssistantConfirmMessage } from '@/modules/Assistant/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useConfirmCardViewModel } from '@/modules/Assistant/components/AssistantDock/components/AssistantPanel/components/ConfirmCard/hooks/useConfirmCardViewModel';
import { useAssistantStore } from '@/store';

const ASKED: IAssistantConfirmMessage = {
  kind: 'confirm',
  id: 'c-1',
  action: 'delete_project',
  subject: 'Lojinha',
  count: 2,
  decision: null,
};

/** O cartão lê a mensagem da store, do jeito que o painel lhe entrega a última. */
function card(message: IAssistantConfirmMessage) {
  useAssistantStore.setState({ messages: [message] });

  return renderHook(() => {
    const latest = useAssistantStore.getState().messages[0] as IAssistantConfirmMessage;

    return useConfirmCardViewModel({ message: latest });
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
});

describe('useConfirmCardViewModel', () => {
  it('asks about a variable by name, and says how many plans still name it', () => {
    const one = card({
      ...ASKED,
      action: 'delete_variable',
      subject: 'LOJA_EMAIL',
      count: 1,
    });

    expect(one.result.current.title).toBe('Delete the variable LOJA_EMAIL?');
    expect(one.result.current.body).toBe(
      'Its value goes with it. One plan still names it.',
    );
    expect(
      card({ ...ASKED, action: 'delete_variable', subject: 'LOJA_EMAIL', count: 0 })
        .result.current.body,
    ).toBe('Its value goes with it, and no plan names it.');
  });

  it('asks about the project by name, and says how many plans go with it', () => {
    const { result } = card(ASKED);

    expect(result.current).toMatchObject({
      title: 'Delete the project “Lojinha”?',
      body: 'Its 2 plans go with it.',
      goLabel: 'Delete',
      keepLabel: 'Keep',
      isOpen: true,
    });
  });

  it('asks to send a bug where it goes, with a button that does not warn, and says it is on its way', () => {
    const { result, rerender } = card({
      ...ASKED,
      action: 'send_bug',
      subject: 'BUG-02',
      count: 0,
      detail: 'Jira · SHOP',
    });

    expect(result.current).toMatchObject({
      title: 'Send BUG-02 to Jira · SHOP?',
      goLabel: 'Send',
      goVariant: 'primary',
    });

    act(() => {
      result.current.onGo();
    });
    rerender();

    expect(result.current.result).toBe('On its way');
  });

  it('warns on the button that deletes', () => {
    expect(card(ASKED).result.current.goVariant).toBe('danger');
  });

  describe('onGo', () => {
    it('confirms once, and the card says it was done', () => {
      const { result, rerender } = card(ASKED);

      act(() => {
        result.current.onGo();
      });
      rerender();

      expect(useAssistantStore.getState().messages[0]).toMatchObject({
        decision: 'confirmed',
      });
      expect(result.current).toMatchObject({
        isOpen: false,
        result: 'Deleted',
        icon: 'passed',
      });
    });

    it('does NOT change a card already answered', () => {
      const { result } = card({ ...ASKED, decision: 'kept' });

      act(() => {
        result.current.onGo();
      });

      expect(useAssistantStore.getState().messages[0]).toMatchObject({
        decision: 'kept',
      });
    });
  });

  describe('onKeep', () => {
    it('keeps the thing, and the card says so', () => {
      const { result, rerender } = card({
        ...ASKED,
        action: 'disconnect_integration',
        subject: 'GitHub',
        count: 0,
      });

      expect(result.current.title).toBe('Disconnect GitHub?');

      act(() => {
        result.current.onKeep();
      });
      rerender();

      expect(result.current).toMatchObject({ isOpen: false, result: 'Kept' });
    });
  });

  it('says nothing changed when nobody answered in time', () => {
    const { result } = card({
      ...ASKED,
      action: 'delete_workspace',
      decision: 'expired',
    });

    expect(result.current).toMatchObject({
      body: 'Its cases, chat, runs and bugs go with it.',
      result: 'No answer came, so nothing changed',
      className: 'confirm-card confirm-card--expired',
    });
  });
});
