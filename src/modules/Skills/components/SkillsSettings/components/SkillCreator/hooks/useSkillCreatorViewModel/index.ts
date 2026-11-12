import type {
  ISkillCreatorProps,
  ISkillTalk,
} from '@/modules/Skills/components/SkillsSettings/components/SkillCreator/types';
import type { IChatQuestion, ISkillDraft, ISkillDraftFile } from '@/shared/types';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SKILL_CREATOR } from '@/modules/Skills/components/SkillsSettings/components/SkillCreator/constants';
import { Skills } from '@/services';
import { useMachineStore, useSettingsStore } from '@/store';

export const useSkillCreatorViewModel = (props: ISkillCreatorProps) => {
  const { onClose, onWrite, onDrafted } = props;
  const { t } = useTranslation();
  const agentName = useSettingsStore((state) => state.agent);
  const [draftId] = useState(
    () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  );
  const [talk, setTalk] = useState<ISkillTalk[]>([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<ISkillDraftFile[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<IChatQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [skill, setSkill] = useState<ISkillDraft | null>(null);
  const question = questions[answers.length] ?? null;
  const talkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const talking = talkRef.current;

    if (talking !== null) talking.scrollTop = talking.scrollHeight;
  }, [talk.length, isWriting, question, skill, error]);

  const send = async (words: string) => {
    const said = words.trim();

    if (said === '' || isWriting) return;

    const { agent, model, language } = useSettingsStore.getState();
    const agentId =
      useMachineStore.getState().agents.find(({ name }) => name === agent)?.id ??
      'claude-code';

    setTalk((kept) => [
      ...kept,
      { id: `q${String(kept.length)}`, from: 'qa', text: said },
    ]);
    setText('');
    setError('');
    setQuestions([]);
    setAnswers([]);
    setIsWriting(true);

    const written = await Skills.write({
      draftId,
      agentId,
      model,
      sessionId,
      text: said,
      current: skill,
      language,
    });

    setIsWriting(false);

    if (!written.isAnswered) {
      if (written.reason !== 'stopped')
        setError(
          written.reason === 'agent-missing'
            ? t('SKILLS.AGENT_MISSING')
            : t('SKILLS.FAILED', { agent }),
        );

      return;
    }

    const { reply, questions: asked, skill: wrote } = written.answer;

    setSessionId(written.sessionId);

    if (reply !== '')
      setTalk((kept) => [
        ...kept,
        { id: `a${String(kept.length)}`, from: 'agent', text: reply },
      ]);

    setQuestions(asked);

    if (wrote !== null) setSkill(wrote);
  };
  const answer = (said: string) => {
    if (question === null || said.trim() === '') return;

    const given = [...answers, `${question.header}: ${said.trim()}`];

    setOther('');

    if (given.length < questions.length) {
      setAnswers(given);

      return;
    }

    void send(given.join('\n'));
  };

  return {
    title: t('SKILLS.NEW_TITLE'),
    width: SKILL_CREATOR.widthPx,
    height: SKILL_CREATOR.heightPx,
    modes: [
      { id: 'agent', label: t('SKILLS.WITH_AGENT') },
      { id: 'hand', label: t('SKILLS.BY_HAND') },
    ],
    intro: t('SKILLS.CREATE_INTRO'),
    talkRef,
    talk,
    isWriting,
    writingLabel: t('SKILLS.WRITING', { agent: agentName }),
    error,
    question:
      question === null
        ? null
        : {
            header: question.header,
            question: question.question,
            options: question.options.map((option) => ({
              key: option.label,
              label: option.label,
              description: option.description,
              onPick: () => {
                answer(option.label);
              },
            })),
          },
    otherLabel: t('SKILLS.OTHER'),
    otherPlaceholder: t('SKILLS.OTHER_PLACEHOLDER'),
    other,
    skill:
      skill === null
        ? null
        : {
            title: t('SKILLS.READY', { name: skill.name }),
            description: skill.description,
          },
    text,
    placeholder: t('SKILLS.CREATE_PLACEHOLDER'),
    attachLabel: t('SKILLS.ATTACH'),
    files: files.map(({ name }) => name),
    sendLabel: t('SKILLS.SEND'),
    stopLabel: t('SKILLS.STOP'),
    canSend: text.trim() !== '' && !isWriting,
    confirmLabel: t('SKILLS.SEE'),
    canConfirm: skill !== null && !isWriting,
    onMode: (id: string) => {
      if (id !== 'hand') return;

      void Skills.dropDraft(draftId);
      onWrite();
    },
    onText: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) return;

      event.preventDefault();
      void send(text);
    },
    onSend: () => {
      void send(text);
    },
    onStop: () => {
      void Skills.stop(draftId);
    },
    onAttach: async () => {
      setFiles(await Skills.attach(draftId));
    },
    onOther: setOther,
    onOtherKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      answer(other);
    },
    onConfirm: () => {
      if (skill === null) return;

      onDrafted({ ...skill, draftId, files });
    },
    onCancel: () => {
      void Skills.stop(draftId);
      void Skills.dropDraft(draftId);
      onClose();
    },
  };
};
