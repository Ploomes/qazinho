import { describe, expect, it } from 'vitest';
import { performSettingsChange } from '@/modules/Assistant/library';
import { fakePort } from './fixtures';

describe('performSettingsChange', () => {
  it('changes the theme, the language and how a run calls the QA', async () => {
    const { port, did } = fakePort();

    expect(
      await performSettingsChange({
        id: 'c-1',
        call: {
          name: 'change_settings',
          args: { theme: 'paper', language: 'en', runAlert: 'app' },
        },
        port,
      }),
    ).toEqual({
      text: 'Done: QAzinho is on the theme the QA sees as Papel, it speaks English, a run that ends calls the QA only inside QAzinho.',
      isError: false,
    });
    expect(did).toEqual(['change {"theme":"light","language":"en","runAlert":"app"}']);
  });

  it('starts connecting a tracker that is not connected, in Settings', async () => {
    const { port, did } = fakePort({ state: { integrations: [] } });
    const done = await performSettingsChange({
      id: 'c-1',
      call: { name: 'connect_integration', args: { integration: 'jira' } },
      port,
    });

    expect(done.text).toContain("Jira's form open");
    expect(done.text).toContain('Never ask for the token in this chat.');
    expect(did).toEqual(['connect jira']);
  });

  it('does NOT connect a tracker twice', async () => {
    const { port, did } = fakePort();

    expect(
      await performSettingsChange({
        id: 'c-1',
        call: { name: 'connect_integration', args: { integration: 'github' } },
        port,
      }),
    ).toEqual({ text: 'GitHub is already connected as octoqa.', isError: false });
    expect(did).toEqual([]);
  });

  it('disconnects a tracker once the QA confirms it on screen', async () => {
    const { port, did } = fakePort();

    expect(
      (
        await performSettingsChange({
          id: 'c-1',
          call: { name: 'disconnect_integration', args: { integration: 'github' } },
          port,
        })
      ).text,
    ).toBe(
      "Disconnected GitHub from QAzinho. The GitHub CLI stays signed in for the QA's other tools.",
    );
    expect(did).toEqual(['confirm disconnect_integration GitHub 0', 'disconnect github']);
  });

  it('does NOT disconnect a tracker the QA kept, or did not answer for', async () => {
    const kept = fakePort({ decision: 'kept' });
    const expired = fakePort({ decision: 'expired' });

    expect(
      (
        await performSettingsChange({
          id: 'c-1',
          call: { name: 'disconnect_integration', args: { integration: 'github' } },
          port: kept.port,
        })
      ).text,
    ).toBe('The QA kept GitHub connected.');
    expect(
      (
        await performSettingsChange({
          id: 'c-1',
          call: { name: 'disconnect_integration', args: { integration: 'github' } },
          port: expired.port,
        })
      ).text,
    ).toBe('The QA did not answer in time, so GitHub is still connected.');
    expect([...kept.did, ...expired.did]).not.toContain('disconnect github');
  });

  it('asks nothing for a tracker that is not connected', async () => {
    const { port, did } = fakePort();

    expect(
      await performSettingsChange({
        id: 'c-1',
        call: { name: 'disconnect_integration', args: { integration: 'jira' } },
        port,
      }),
    ).toEqual({ text: 'Jira is not connected.', isError: false });
    expect(did).toEqual([]);
  });
});
