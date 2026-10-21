import { describe, expect, it } from 'vitest';
import { performWorkspaceChange } from '@/modules/Assistant/library';
import { CHECKOUT, fakePort } from './fixtures';

describe('performWorkspaceChange', () => {
  describe('create_workspace', () => {
    it('creates a workspace on the target named, and opens it', () => {
      const { port, state, did } = fakePort();

      expect(
        performWorkspaceChange({
          call: {
            name: 'create_workspace',
            args: { project: 'Lojinha', name: 'Pix', target: 'android' },
          },
          port,
        }),
      ).toEqual({
        text: 'Created workspace w-1760000000000 "Pix" in p1 on android, and opened it on its chat, where its agent writes the plan with the QA.',
        isError: false,
      });
      expect(state.workspaces.at(-1)).toMatchObject({
        id: 'w-1760000000000',
        projectId: 'p1',
        name: 'Pix',
        targetId: 't-android',
        planKind: 'mobile',
        plan: [],
        live: null,
      });
      expect(did).toEqual(['add w-1760000000000']);
    });

    it('does NOT guess the target of a project with several', () => {
      const { port, did } = fakePort();

      expect(
        performWorkspaceChange({
          call: { name: 'create_workspace', args: { project: 'p1', name: 'Pix' } },
          port,
        }),
      ).toEqual({
        text: 'p1 tests on web, android: say which target the workspace is for.',
        isError: true,
      });
      expect(
        performWorkspaceChange({
          call: {
            name: 'create_workspace',
            args: { project: 'p1', name: 'Pix', target: 'ios' },
          },
          port,
        }).text,
      ).toBe('p1 has no ios target. Its targets are web, android.');
      expect(did).toEqual([]);
    });
  });

  it('renames a workspace', () => {
    const { port, did } = fakePort();

    expect(
      performWorkspaceChange({
        call: {
          name: 'rename_workspace',
          args: { workspace: 'Login', name: 'Login social' },
        },
        port,
      }).text,
    ).toBe('Renamed w2 from "Login" to "Login social".');
    expect(did).toEqual(['rename w2 Login social']);
  });

  describe('explore_app', () => {
    it('explores a workspace with no plan yet, and says the exploration it started', () => {
      const { port, did } = fakePort();

      expect(
        performWorkspaceChange({
          call: { name: 'explore_app', args: { workspace: 'Login' } },
          port,
        }),
      ).toEqual({
        text: 'Started exploration r-02 of w2 "Login" on android, on screen now. It goes on by itself for 10 minutes, and leaves a suggested plan in the workspace\'s chat.',
        isError: false,
      });
      expect(did).toEqual(['explore w2']);
    });

    it('does NOT explore while something already walks, nor without a target', () => {
      const live = CHECKOUT.live;
      const running = fakePort({
        state: {
          workspaces: [
            {
              ...CHECKOUT,
              live: live === null ? null : { ...live, id: 'r-02', isDone: false },
            },
          ],
        },
      });
      const gone = fakePort({
        state: { workspaces: [{ ...CHECKOUT, targetId: 't-gone' }] },
      });

      expect(
        performWorkspaceChange({
          call: { name: 'explore_app', args: { workspace: 'w1' } },
          port: running.port,
        }).text,
      ).toBe('w1 is already running r-02.');
      expect(
        performWorkspaceChange({
          call: { name: 'explore_app', args: { workspace: 'w1' } },
          port: gone.port,
        }).isError,
      ).toBe(true);
      expect([...running.did, ...gone.did]).toEqual([]);
    });
  });

  describe('run_plan', () => {
    it('runs a workspace with a plan, and says the run it started', () => {
      const { port, did } = fakePort();

      expect(
        performWorkspaceChange({
          call: { name: 'run_plan', args: { workspace: 'w1' } },
          port,
        }),
      ).toEqual({
        text: 'Started r-02 of w1 "Checkout regression": 6 steps on web, on screen now. It goes on by itself, and the QA hears when it ends.',
        isError: false,
      });
      expect(did).toEqual(['run w1']);
    });

    it('does NOT run a workspace with no plan, one already running, or one whose target is gone', () => {
      const live = CHECKOUT.live;
      const running = fakePort({
        state: {
          workspaces: [
            {
              ...CHECKOUT,
              live: live === null ? null : { ...live, id: 'r-02', isDone: false },
            },
          ],
        },
      });
      const gone = fakePort({
        state: { workspaces: [{ ...CHECKOUT, targetId: 't-gone' }] },
      });
      const { port, did } = fakePort();

      expect(
        performWorkspaceChange({
          call: { name: 'run_plan', args: { workspace: 'w2' } },
          port,
        }).text,
      ).toBe('w2 "Login" has no plan to run yet: its chat writes one with the QA.');
      expect(
        performWorkspaceChange({
          call: { name: 'run_plan', args: { workspace: 'w1' } },
          port: running.port,
        }).text,
      ).toBe('w1 is already running r-02.');
      expect(
        performWorkspaceChange({
          call: { name: 'run_plan', args: { workspace: 'w1' } },
          port: gone.port,
        }).isError,
      ).toBe(true);
      expect([...did, ...running.did, ...gone.did]).toEqual([]);
    });

    it('says so when the run would not start', () => {
      const { port } = fakePort({ runId: null });

      expect(
        performWorkspaceChange({
          call: { name: 'run_plan', args: { workspace: 'w1' } },
          port,
        }),
      ).toEqual({ text: 'QAzinho could not start the run.', isError: true });
    });
  });

  describe('stop_run', () => {
    it('stops the run going on', () => {
      const live = CHECKOUT.live;
      const { port, did } = fakePort({
        state: {
          workspaces: [
            {
              ...CHECKOUT,
              live: live === null ? null : { ...live, id: 'r-02', isDone: false },
            },
          ],
        },
      });

      expect(
        performWorkspaceChange({
          call: { name: 'stop_run', args: { workspace: 'w1' } },
          port,
        }).text,
      ).toBe('Stopped r-02 of w1 "Checkout regression".');
      expect(did).toEqual(['stop w1']);
    });

    it('stops nothing when nothing runs', () => {
      const { port, did } = fakePort();

      expect(
        performWorkspaceChange({
          call: { name: 'stop_run', args: { workspace: 'w1' } },
          port,
        }),
      ).toEqual({
        text: 'w1 "Checkout regression" has no run going on, so there is nothing to stop.',
        isError: false,
      });
      expect(did).toEqual([]);
    });
  });
});
