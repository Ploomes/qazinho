import { describe, expect, it } from 'vitest';
import { filingPlanOf } from '@/modules/Bug/library';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const STORY = {
  key: 'SHOP-12',
  title: 'Aplicar cupom',
  source: 'jira' as const,
  url: 'https://acme.atlassian.net/browse/SHOP-12',
};

describe('filingPlanOf', () => {
  it('sends Jira the screens, the recorded run’s video and the link to the story', () => {
    const workspace = { ...recordedRun(), issue: STORY };
    const [bug] = workspace.bugs;
    const plan = filingPlanOf({ workspace, bug: bug!, tracker: 'jira' });

    expect(plan.shots.map(({ kind, file }) => `${kind} ${file ?? ''}`)).toEqual([
      'before /tmp/qazinho/step-4.jpg',
      'broke /tmp/qazinho/step-5.jpg',
    ]);
    expect(plan.videoRun?.id).toBe('r-01');
    expect(plan.story).toEqual({ key: 'SHOP-12', url: STORY.url });
    expect(plan.moment?.at).toBe(1_760_000_010_000);
    expect(plan.steps).toEqual(['ready', 'issue', 'screens', 'video', 'link']);
  });

  it('sends GitHub only the words, with the screen that broke kept to paste', () => {
    const workspace = { ...recordedRun(), issue: STORY };
    const [bug] = workspace.bugs;
    const plan = filingPlanOf({ workspace, bug: bug!, tracker: 'github' });

    expect(plan.shots).toEqual([]);
    expect(plan.videoRun).toBeNull();
    expect(plan.screen?.file).toBe('/tmp/qazinho/step-5.jpg');
    expect(plan.steps).toEqual(['ready', 'issue']);
  });

  it('sends no video for a run that recorded none, and links no story the workspace does not work from', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
    const [bug] = workspace.bugs;

    expect(filingPlanOf({ workspace, bug: bug!, tracker: 'jira' }).steps).toEqual([
      'ready',
      'issue',
      'screens',
    ]);
  });

  it('sends the screen a later run caught, and that run’s moment', () => {
    const workspace = recordedRun();
    const [first] = workspace.bugs;
    const bug = {
      ...first!,
      sightings: [
        {
          runId: 'r-02',
          runWhen: '10:05',
          caseId: 'TC-02',
          stepNumber: 2,
          at: 1_760_000_100_000,
          shot: { isBad: true, src: null, file: '/tmp/qazinho/r-02/step-5.jpg' },
        },
      ],
    };
    const plan = filingPlanOf({ workspace, bug, tracker: 'jira' });

    expect(plan.shots.at(-1)).toEqual({
      kind: 'again',
      run: 'r-02',
      file: '/tmp/qazinho/r-02/step-5.jpg',
      src: null,
    });
    expect(plan.moment?.runId).toBe('r-02');
    expect(plan.videoRun?.id).toBe('r-01');
    expect(plan.screen?.file).toBe('/tmp/qazinho/r-02/step-5.jpg');
  });
});
