/** How a run goes: cases with a recipe walked again without the agent, every case with the agent, or the app explored by the agent with no plan. */
export type RunMode = 'replay' | 'agent' | 'explore';
