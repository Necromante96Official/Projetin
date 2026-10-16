// render/sprites/shared.ts — tipos compartilhados dos lutadores.
// Luz sempre do topo: fileira clara em cima, sombra embaixo (via V()).

import type { EquipSlot } from '../../core/types.js';
import type { Ctx2D } from '../pixel.js';

export type EquipVisual = Record<EquipSlot, number>;

export interface PoseLutador {
  x: number;
  peY: number;
  /** escala base (arena usa 3.6) */
  s: number;
  /** tempo global p/ animação */
  t: number;
  lunge: number;
  /** progresso do golpe (0..~1) ou null em repouso */
  swing: number | null;
  flash: number;
  caido: boolean;
  dir: 1 | -1;
}

export interface OptsCavaleiro extends PoseLutador {
  equip: EquipVisual;
}

export interface OptsMonstro extends PoseLutador {
  /** multiplicador de escala (boss = 2.1) */
  esc?: number;
}

export type DesenharFn<O extends PoseLutador> = (ctx: Ctx2D, o: O) => void;

export const EQUIP_VAZIO: EquipVisual = {
  elmo: 0,
  camisa: 0,
  calcas: 0,
  botas: 0,
  arma: 0,
  escudo: 0,
};
