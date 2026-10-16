// core/offline.ts — renda passiva e ganho offline (lógica pura, sem timers).

import { gerarHorda } from './horde.js';
import type { GanhoOffline, GameState } from './types.js';

/** teto: 4h de ausência contam; abaixo de 30s não há ganho. */
export const OFFLINE_MIN_SEGS = 30;
export const OFFLINE_MAX_MIN = 240;

export function ouroPorMinuto(state: GameState): number {
  const h = gerarHorda(state);
  const porAbate = h.inimigos[0] ? h.inimigos[0].gold : 5;
  return Math.max(3, Math.round(porAbate * 4));
}

export function calcularGanhoOffline(state: GameState, agora: number = Date.now()): GanhoOffline {
  const segundosFora = Math.floor((agora - (state.updatedAt || agora)) / 1000);
  if (segundosFora < OFFLINE_MIN_SEGS) return { segundosFora, ouro: 0 };
  const minutos = Math.min(segundosFora / 60, OFFLINE_MAX_MIN);
  return { segundosFora, ouro: Math.round(ouroPorMinuto(state) * minutos) };
}
