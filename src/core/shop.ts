// core/shop.ts — loja: equipamentos (tiers por slot) + skills passivas.
// Toda compra valida existência, teto e saldo; atualiza updatedAt no sucesso.

import { EQUIPS, MAX_SKILL, MAX_TIER, ORDEM_SKILLS, ORDEM_SLOTS, SKILLS } from './data.js';
import type { CompraAuto, EquipSlot, GameState, SkillId } from './types.js';

export function custoEquip(state: GameState, slot: EquipSlot): number | null {
  if (!EQUIPS[slot]) return null;
  const atual = state.equip[slot] ?? 0;
  if (atual >= MAX_TIER) return null;
  return EQUIPS[slot].tiers[atual + 1].custo;
}

export function comprarEquip(state: GameState, slot: EquipSlot): boolean {
  if (!EQUIPS[slot]) return false;
  const atual = state.equip[slot] ?? 0;
  if (atual >= MAX_TIER) return false;
  const custo = EQUIPS[slot].tiers[atual + 1].custo;
  if (state.ouro < custo) return false;
  state.ouro -= custo;
  state.equip[slot] = atual + 1;
  state.updatedAt = Date.now();
  return true;
}

export function custoSkill(state: GameState, id: SkillId): number | null {
  if (!SKILLS[id]) return null;
  const atual = state.skills[id] ?? 0;
  if (atual >= MAX_SKILL) return null;
  return SKILLS[id].base * (atual + 1);
}

export function comprarSkill(state: GameState, id: SkillId): boolean {
  if (!SKILLS[id]) return false;
  const atual = state.skills[id] ?? 0;
  if (atual >= MAX_SKILL) return false;
  const custo = SKILLS[id].base * (atual + 1);
  if (state.ouro < custo) return false;
  state.ouro -= custo;
  state.skills[id] = atual + 1;
  state.updatedAt = Date.now();
  return true;
}

export function totalTiersEquip(state: GameState): number {
  return ORDEM_SLOTS.reduce((s, k) => s + (state.equip[k] ?? 0), 0);
}

/** Menor custo entre equipamentos e skills ainda compráveis (null = tudo no máximo). */
export function custoProximaMelhoria(state: GameState): number | null {
  let menor: number | null = null;
  for (const slot of ORDEM_SLOTS) {
    const custo = custoEquip(state, slot);
    if (custo != null && (menor == null || custo < menor)) menor = custo;
  }
  for (const id of ORDEM_SKILLS) {
    const custo = custoSkill(state, id);
    if (custo != null && (menor == null || custo < menor)) menor = custo;
  }
  return menor;
}

/**
 * Compra em sequência a melhoria mais barata que couber no ouro.
 * Usado pelo botão "Comprar acessível" (QoL) e para acelerar a volta pós-renascimento.
 */
export function comprarMelhoriasAcessiveis(state: GameState): CompraAuto {
  let compras = 0;
  let gasto = 0;
  for (let guard = 0; guard < 100; guard++) {
    let alvo: { tipo: 'equip'; slot: EquipSlot } | { tipo: 'skill'; id: SkillId } | null = null;
    let menor = Infinity;
    for (const slot of ORDEM_SLOTS) {
      const custo = custoEquip(state, slot);
      if (custo != null && custo <= state.ouro && custo < menor) {
        menor = custo;
        alvo = { tipo: 'equip', slot };
      }
    }
    for (const id of ORDEM_SKILLS) {
      const custo = custoSkill(state, id);
      if (custo != null && custo <= state.ouro && custo < menor) {
        menor = custo;
        alvo = { tipo: 'skill', id };
      }
    }
    if (!alvo) break;
    const antes = state.ouro;
    const ok = alvo.tipo === 'equip' ? comprarEquip(state, alvo.slot) : comprarSkill(state, alvo.id);
    if (!ok) break;
    compras += 1;
    gasto += antes - state.ouro;
  }
  return { compras, gasto };
}
