/**
 * Em que pé um build está como um todo: andando, construído, falhou, ou parado pelo QA.
 */
export type BuildPhase = 'working' | 'built' | 'failed' | 'stopped';
