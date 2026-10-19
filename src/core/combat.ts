// core/combat.ts — soma de atributos: base + equipamentos, depois % das skills.
// Determinístico e puro: mesma entrada => mesma saída (testado em test/).

import { EQUIPS, ORDEM_SLOTS, REGRAS, SKILL_MULT } from './data.js';
import type { CombatParams, GameState, SkillId } from './types.js';

// Soma tudo: base + equipamentos, depois % das skills.
export function parametrosCombate(state: GameState): CombatParams {
  let eqAtk = 0;
  let eqHp = 0;
  for (const slot of ORDEM_SLOTS) {
    const tierIdx = state.equip[slot] ?? 0;
    const t = EQUIPS[slot].tiers[tierIdx] ?? EQUIPS[slot].tiers[0];
    eqAtk += t.atk;
    eqHp += t.hp;
  }
  const nv = (id: SkillId): number => state.skills[id] ?? 0;
  const atk = Math.round(
    (state.cavaleiro.atk + eqAtk) * (1 + SKILL_MULT.afiadoPorNv * nv('afiado')),
  );
  const hp = Math.round(
    (state.cavaleiro.hp + eqHp) * (1 + SKILL_MULT.vigorPorNv * nv('vigor')),
  );
  return {
    atk: Math.max(1, atk),
    hp: Math.max(1, hp),
    intervalo: Math.max(
      SKILL_MULT.intervaloMinimo,
      REGRAS.intervaloBase * (1 - SKILL_MULT.rapidezPorNv * nv('rapidez')),
    ),
    regen: SKILL_MULT.regenPorNv * nv('regen'),
    ouroMult: 1 + SKILL_MULT.saquePorNv * nv('saque'),
  };
}

export function poderCavaleiro(state: GameState): { atk: number; hp: number } {
  const p = parametrosCombate(state);
  return { atk: p.atk, hp: p.hp };
}

/** Alias histórico (antes havia esquadrão; hoje é só o cavaleiro). */
export function poderTime(state: GameState): { atk: number; hp: number } {
  return poderCavaleiro(state);
}
