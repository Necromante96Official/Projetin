// core/state.ts — criação e migração de save. Único lugar que conhece
// os formatos antigos (fase única, esquadrão, prédios) e o saneamento anti-NaN.

import { EQUIPS, MAX_SKILL, MAX_TIER, ORDEM_SKILLS, ORDEM_SLOTS } from './data.js';
import type { EquipSlot, GameState, SaveCru, SkillId } from './types.js';

const num = (v: unknown, d: number): number =>
  Number.isFinite(+String(v)) && v !== '' && v !== null && v !== undefined
    ? +(v as number)
    : d;

export function criarEstadoInicial(): GameState {
  return {
    ouro: 30,
    lugar: 0,
    nivel: 1,
    vitorias: 0,
    derrotas: 0,
    abates: 0,
    equip: { elmo: 0, camisa: 0, calcas: 0, botas: 0, arma: 0, escudo: 0 },
    skills: { afiado: 0, vigor: 0, regen: 0, rapidez: 0, saque: 0 },
    cavaleiro: { nome: 'Sor Aria', atk: 10, hp: 100 },
    updatedAt: Date.now(),
  };
}

export function migrarSave(state: SaveCru | null | undefined): GameState {
  if (!state) return criarEstadoInicial();
  const base = criarEstadoInicial();
  const s: GameState & Record<string, unknown> = { ...base, ...(state as object) } as GameState &
    Record<string, unknown>;

  // números sempre finitos (save corrompido = NaN = luta infinita)
  s.ouro = num(s.ouro, 30);
  s.lugar = Math.max(0, Math.floor(num(s.lugar, 0)));
  s.nivel = Math.min(10, Math.max(1, Math.floor(num(s.nivel, 1))));
  for (const k of ['vitorias', 'derrotas', 'abates'] as const) {
    (s as Record<string, number>)[k] = Math.max(0, Math.floor(num(s[k], 0)));
  }

  // modelo antigo de fase única
  const nivelInimigo = num((s as SaveCru).nivelInimigo, NaN);
  if (Number.isFinite(nivelInimigo) && s.nivel === 1 && s.lugar === 0) {
    const prog = Math.max(0, Math.floor(nivelInimigo) - 1);
    s.lugar = Math.floor(prog / 10);
    s.nivel = (prog % 10) + 1;
  }
  delete s.nivelInimigo;

  // modelo antigo de esquadrão vira base do cavaleiro
  const herois = (s as SaveCru).herois;
  const cavRaw = (s as SaveCru).cavaleiro as { nome?: unknown; atk?: unknown; hp?: unknown } | undefined;
  const cavInvalido = !cavRaw || typeof cavRaw !== 'object' || !Number.isFinite(+(cavRaw.atk as number));
  if (cavInvalido && Array.isArray(herois) && herois.length > 0) {
    const atk = herois.reduce((a, h) => a + num(h?.atk, 0), 0);
    const hp = herois.reduce((a, h) => a + num(h?.hp, 0), 0);
    const primeiro = typeof herois[0]?.nome === 'string' ? (herois[0].nome as string) : 'Aria';
    s.cavaleiro = { nome: `Sor ${primeiro}`, atk: Math.max(6, atk), hp: Math.max(40, hp) };
  }
  delete s.herois;
  if (!s.cavaleiro || typeof s.cavaleiro !== 'object') s.cavaleiro = { ...base.cavaleiro };
  s.cavaleiro = {
    nome:
      typeof s.cavaleiro.nome === 'string' && s.cavaleiro.nome ? s.cavaleiro.nome : 'Sor Aria',
    atk: num(s.cavaleiro.atk, 10),
    hp: num(s.cavaleiro.hp, 100),
  };

  // prédios antigos viram reembolso em ouro (sistema removido)
  let refund = 0;
  for (const k of ['quartel', 'muralha', 'mercado']) {
    refund += Math.max(0, Math.floor(num(s[k], 1)) - 1) * 40;
    delete s[k];
  }
  delete s.treinar;
  s.ouro += refund;

  // equipamentos e skills com defaults
  const equipCru = (state.equip ?? {}) as Partial<Record<EquipSlot, unknown>>;
  s.equip = { ...base.equip };
  for (const slot of ORDEM_SLOTS) {
    s.equip[slot] = Math.min(MAX_TIER, Math.max(0, Math.floor(num(equipCru[slot], 0))));
  }
  const skillsCru = (state.skills ?? {}) as Partial<Record<SkillId, unknown>>;
  s.skills = { ...base.skills };
  for (const id of ORDEM_SKILLS) {
    s.skills[id] = Math.min(MAX_SKILL, Math.max(0, Math.floor(num(skillsCru[id], 0))));
  }

  // garante que EQUIPS referenciados existam (protege save com slot inválido)
  for (const slot of Object.keys(s.equip) as EquipSlot[]) {
    if (!EQUIPS[slot]) delete (s.equip as Partial<Record<string, number>>)[slot];
  }

  return s as GameState;
}
