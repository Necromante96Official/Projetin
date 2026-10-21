// core/index.ts — fachada do núcleo: re-exporta tudo para import único.
// UI e engine importam daqui (`@/core` ou caminho relativo), nunca de
// arquivos internos isolados — isso mantém a "memória" da modularização.

export type * from './types.js';
export * from './data.js';
export * from './state.js';
export * from './combat.js';
export * from './horde.js';
export * from './shop.js';
export * from './prestige.js';
export * from './inventory.js';
export * from './offline.js';
export * from './achievements.js';
export * from './missions.js';
