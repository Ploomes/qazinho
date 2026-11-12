import type {
  ISkillImportProps,
  SkillImportFrom,
} from '@/modules/Skills/components/SkillsSettings/components/SkillImport/types';
import type {
  IRepository,
  IRepositoryList,
  ISkillFound,
  SkillsFound,
} from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SKILL_IMPORT } from '@/modules/Skills/components/SkillsSettings/components/SkillImport/constants';
import { useSkillActions } from '@/modules/Skills/hooks';
import { Github, Skills } from '@/services';
import { useSetupStore } from '@/store';

export const useSkillImportViewModel = (props: ISkillImportProps) => {
  const { onClose } = props;
  const { t } = useTranslation();
  const { importSkills, importFile } = useSkillActions();
  const isGithubOn = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const [from, setFrom] = useState<SkillImportFrom>('repo');
  const [list, setList] = useState<IRepositoryList | null>(null);
  const [query, setQuery] = useState('');
  const [repository, setRepository] = useState<IRepository | null>(null);
  const [branch, setBranch] = useState('');
  const [folder, setFolder] = useState<string>(SKILL_IMPORT.folder);
  const [found, setFound] = useState<SkillsFound | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [here, setHere] = useState<ISkillFound[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    if (from === 'repo' && isGithubOn && list === null)
      void Github.repositories().then(setList);
    if (from === 'computer' && here === null) void Skills.found().then(setHere);
  }, [from, isGithubOn, list, here]);

  const keyOf = (one: IRepository) => `${one.owner}/${one.name}`;
  const repositories = list?.isListed === true ? list.repositories : [];
  const skills: ISkillFound[] =
    from === 'computer' ? (here ?? []) : found?.isFound === true ? found.skills : [];
  const choose = (path: string) => (isOn: boolean) => {
    setChosen((kept) => (isOn ? [...kept, path] : kept.filter((one) => one !== path)));
  };

  return {
    title: t('SKILLS.IMPORT_TITLE'),
    width: SKILL_IMPORT.widthPx,
    froms: [
      { id: 'repo', label: t('SKILLS.FROM_TEAM_REPO') },
      { id: 'computer', label: t('SKILLS.FROM_THIS_COMPUTER') },
      { id: 'file', label: t('SKILLS.FROM_FILE') },
    ],
    from,
    note: t('SKILLS.ARRIVE_OFF'),
    isRepo: from === 'repo',
    isFile: from === 'file',
    githubNote: isGithubOn ? '' : t('SKILLS.NO_CLI'),
    search: {
      query,
      label: t('SKILLS.REPOSITORY'),
      placeholder: t('SKILLS.REPOSITORY'),
      items: repositories
        .filter((one) => keyOf(one).toLowerCase().includes(query.trim().toLowerCase()))
        .map((one) => ({
          id: keyOf(one),
          label: keyOf(one),
          tag: null,
          detail: one.description,
        })),
      note: null,
      emptyText: t('COMMANDS.NONE', { query }),
    },
    picked: repository === null ? null : keyOf(repository),
    branchLabel: t('SKILLS.BRANCH'),
    branch,
    folderLabel: t('SKILLS.FOLDER'),
    folder,
    lookLabel: isLooking ? t('SKILLS.LOOKING') : t('SKILLS.LOOK'),
    canLook: repository !== null && branch.trim() !== '' && !isLooking,
    foundNote:
      found === null || found.isFound
        ? ''
        : found.reason === 'empty'
          ? t('SKILLS.NONE_IN', { folder })
          : found.reason === 'no-cli'
            ? t('SKILLS.NO_CLI')
            : t('SKILLS.REFUSED'),
    hereNote: from === 'computer' && here?.length === 0 ? t('SKILLS.NONE_HERE') : '',
    keptLabel: t('SKILLS.KEPT'),
    skills: skills.map((skill) => ({
      key: skill.path,
      name: skill.name,
      description: skill.description,
      isKept: skill.isKept,
      isOn: chosen.includes(skill.path),
      onChange: choose(skill.path),
    })),
    fileNote: t('SKILLS.FILE_NOTE'),
    pickFileLabel: t('SKILLS.PICK_FILE'),
    confirmLabel:
      chosen.length === 0
        ? t('SKILLS.IMPORT')
        : chosen.length === 1
          ? t('SKILLS.IMPORT_ONE')
          : t('SKILLS.IMPORT_OTHER', { count: chosen.length }),
    canConfirm: from !== 'file' && chosen.length > 0,
    onFrom: (id: string) => {
      if (id === 'repo' || id === 'computer' || id === 'file') {
        setFrom(id);
        setChosen([]);
      }
    },
    onQuery: setQuery,
    onPickRepository: (id: string) => {
      const picked = repositories.find((one) => keyOf(one) === id) ?? null;

      setRepository(picked);
      setBranch(picked?.defaultBranch ?? '');
      setFound(null);
      setChosen([]);
    },
    onBranch: setBranch,
    onFolder: setFolder,
    onLook: async () => {
      if (repository === null) return;

      setIsLooking(true);
      setFound(
        await Skills.foundIn({
          repository: keyOf(repository),
          branch: branch.trim(),
          folder: folder.trim(),
        }),
      );
      setIsLooking(false);
      setChosen([]);
    },
    onPickFile: async () => {
      if ((await importFile()).length > 0) onClose();
    },
    onConfirm: async () => {
      if (from === 'computer') await importSkills({ from: 'computer', paths: chosen });
      else if (repository !== null)
        await importSkills({
          from: 'repo',
          repository: keyOf(repository),
          branch: branch.trim(),
          folder: folder.trim(),
          names: chosen,
        });

      onClose();
    },
    onCancel: onClose,
  };
};
