import { useEffect } from 'react';
import { Skills } from '@/services';
import { useSkillStore } from '@/store';

export const useSkills = () => {
  const setSkills = useSkillStore((state) => state.setSkills);

  useEffect(() => {
    void Skills.list().then(setSkills);
  }, [setSkills]);
};
