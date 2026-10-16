// render/sprites/index.ts — barrel dos lutadores.
// Import único: `import { desenharCavaleiro, desenharMonstro, TIPOS } from ...`.

export { desenharCavaleiro } from './knight.js';
export { desenharMonstro, TIPOS } from './monsters.js';
export type { TipoMonstro, MonstroExtra, MonstroArma } from './monsters.js';
export { EQUIP_VAZIO } from './shared.js';
export type { EquipVisual, OptsCavaleiro, OptsMonstro, PoseLutador } from './shared.js';
