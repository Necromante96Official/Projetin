// core/shop.ts — loja: equipamentos (tiers por slot) + skills passivas.
// Toda compra valida existência, teto e saldo; atualiza updatedAt no sucesso.

import { EQUIPS, MAX_SKILL, MAX_TIER, ORDEM_SLOTS, SKILLS } from './data.js';
import type { EquipSlot, GameState, SkillId } from './types.js';

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
