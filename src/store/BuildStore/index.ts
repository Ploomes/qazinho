import type { IBuildStore } from './types';
import { create } from 'zustand';
import { followBuild } from '@/modules/Build/library';

export const useBuildStore = create<IBuildStore>((set) => ({
  builds: [],

  startBuild: (build) => set((state) => ({ builds: [build, ...state.builds] })),

  followBuild: (event) =>
    set((state) => ({
      builds: state.builds.map((build) =>
        build.id === event.buildId ? followBuild({ build, event }) : build,
      ),
    })),
}));
