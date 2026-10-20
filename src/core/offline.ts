// core/offline.ts — renda passiva e ganho offline (lógica pura, sem timers).

import { parametrosCombate } from './combat.js';
import { MAX_LUGAR } from './data.js';
import type { GanhoOffline, GameState } from './types.js';

/** teto: 4h de ausência contam; abaixo de 30s não há ganho. */
export const OFFLINE_MIN_SEGS = 30;
export const OFFLINE_MAX_MIN = 240;

export function ouroPorMinuto(state: GameState): number {
  const nivel = Math.min(
    10,
    Math.max(1, Math.floor(Number.isFinite(state.nivel) ? state.nivel : 1)),
  );
  const lugar = Math.min(
    MAX_LUGAR,
    Math.max(0, Math.floor(Number.isFinite(state.lugar) ? state.lugar : 0)),
  );
  const ouroMult = parametrosCombate(state).ouroMult;
  const porAbate = (3 + nivel * 1.5) * (1 + lugar * 2) * ouroMult;
  return Math.max(3, Math.round(porAbate * 4));
}

export function calcularGanhoOffline(state: GameState, agora: number = Date.now()): GanhoOffline {
  const ultimo = Number.isFinite(state.updatedAt) ? state.updatedAt : agora;
  const segundosFora = Math.max(0, Math.floor((agora - ultimo) / 1000));
  if (segundosFora < OFFLINE_MIN_SEGS) return { segundosFora, ouro: 0 };
  const minutos = Math.min(segundosFora / 60, OFFLINE_MAX_MIN);
  return { segundosFora, ouro: Math.round(ouroPorMinuto(state) * minutos) };
}
