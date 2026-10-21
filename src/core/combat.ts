// core/combat.ts — soma de atributos: base + equipamentos, depois % das skills.
// Determinístico e puro: mesma entrada => mesma saída (testado em test/).

import { EQUIPS, ORDEM_SLOTS, PRESTIGIO, REGRAS, SKILL_MULT } from './data.js';
import type { CombatParams, GameState, SkillId } from './types.js';

/** Multiplicadores permanentes ganhos em renascimentos. */
export function bonusPrestigio(state: GameState): { stats: number; ouro: number } {
  const b = Number.isFinite(state.brasoes)
    ? Math.max(0, Math.min(PRESTIGIO.maxBrasoes, Math.floor(state.brasoes)))
    : 0;
  return {
    stats: 1 + PRESTIGIO.bonusStatsPorBrasao * b,
    ouro: 1 + PRESTIGIO.bonusOuroPorBrasao * b,
  };
}

// Soma tudo: base + equipamentos, depois % das skills e bônus de renascimento.
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
  const prestigio = bonusPrestigio(state);
  const atk = Math.round(
    (state.cavaleiro.atk + eqAtk) * (1 + SKILL_MULT.afiadoPorNv * nv('afiado')) * prestigio.stats,
  );
  const hp = Math.round(
    (state.cavaleiro.hp + eqHp) * (1 + SKILL_MULT.vigorPorNv * nv('vigor')) * prestigio.stats,
  );
  return {
    atk: Math.max(1, atk),
    hp: Math.max(1, hp),
    intervalo: Math.max(
      SKILL_MULT.intervaloMinimo,
      REGRAS.intervaloBase * (1 - SKILL_MULT.rapidezPorNv * nv('rapidez')),
    ),
    regen: SKILL_MULT.regenPorNv * nv('regen') * prestigio.stats,
    ouroMult: (1 + SKILL_MULT.saquePorNv * nv('saque')) * prestigio.ouro,
    reducaoDano: Math.min(
      SKILL_MULT.reducaoDanoMax,
      SKILL_MULT.tenacidadePorNv * nv('tenacidade'),
    ),
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
