import type { IHarnessSection } from '@/harness/context/types';
import type { IChangeBrief } from '@/harness/types';

/** The team's suite and the test that broke in it, as the sections the agent changing it reads before it starts. */
export function describeChange(
  props: Omit<IChangeBrief, 'readDirs' | 'language'>,
): IHarnessSection[] {
  const { broken } = props;

  return [
    {
      title: "The team's suite",
      lines: [
        `The suite is in ${props.dir}: read and change files there, and nowhere else.`,
        props.projects.length === 0
          ? `Its config is ${props.config}, with no Playwright project of its own.`
          : `Its config is ${props.config}, with the Playwright projects ${props.projects.join(', ')}.`,
        `This copy is on the branch ${props.branch}, made from ${props.base === '' ? 'a commit with no branch' : props.base} at commit ${props.commit.slice(0, 7)}.`,
        ...(props.commits.length === 0
          ? []
          : [
              "The team's latest commit messages:",
              ...props.commits.map((one) => `- ${one}`),
            ]),
      ],
    },
    {
      title: 'The test that broke',
      lines: [
        `${broken.title}, written in ${broken.file}:${String(broken.line)}${
          broken.path.length === 0
            ? ''
            : `, inside ${broken.path.map((describe) => `"${describe}"`).join(' and ')}`
        }.`,
        ...(broken.project === ''
          ? []
          : [`It runs in the Playwright project ${broken.project}.`]),
        'It failed with:',
        '```',
        broken.error,
        '```',
        ...(broken.notes === ''
          ? []
          : [
              'What Playwright noted of the page and the test when it failed:',
              '````markdown',
              broken.notes,
              '````',
            ]),
        ...(broken.screenshots.length === 0
          ? []
          : [`Its screenshot: ${broken.screenshots.join(', ')}`]),
      ],
    },
  ];
}
