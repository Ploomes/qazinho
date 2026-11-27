import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { SkillLibrary } from '@/main/classes/skills/SkillLibrary';
import type { Harness } from '@ploomes/qazinho-harness';

export interface ISkillWriter {
  runner: Pick<AgentRunner, 'ask' | 'cancel'>;
  harness: Pick<Harness, 'writeSkill' | 'readSkill'>;
  library: Pick<SkillLibrary, 'draftDir' | 'draftFiles'>;
  findCommand: (agentId: string) => Promise<string | null>;
}
