// core/data.ts — dados estáticos de balanceamento (sem lógica, sem estado).
// Edite aqui para rebalancear: custos, atributos por tier, skills, lugares, regras.

import type {
  EquipDef,
  EquipSlot,
  LugarDef,
  RegrasCombate,
  SkillDef,
  SkillId,
} from './types.js';

export const NOMES_MONSTROS: readonly string[] = [
  'Goblin',
  'Orc',
  'Lobo Cinzento',
  'Esqueleto',
  'Bandido',
  'Troll',
];

export const LUGARES: readonly LugarDef[] = [
  {
    id: 'campo',
    nome: 'Campo Verde',
    bioma: 'campo',
    kinds: [0, 1, 2],
    bossKind: 1,
    bossNome: 'Orc Chefe',
  },
  {
    id: 'floresta',
    nome: 'Floresta Sombria',
    bioma: 'floresta',
    kinds: [3, 4, 5],
    bossKind: 5,
    bossNome: 'Troll Ancião',
  },
];

export const REGRAS: Readonly<RegrasCombate> = {
  intervaloBase: 0.75,
  intervaloInimigo: 1.1,
  alcancePlayer: 64,
  alcanceInimigo: 52,
  spawnCd: 0.4,
  velBase: 55,
  distSpawn: 290,
  cdInicialJogador: 0.4,
  cdInicialInimigo: 0.6,
};

/** Teto defensivo do lugar absoluto: evita Infinity em Math.pow com save absurdo. */
export const MAX_LUGAR = 999;

// --- Equipamentos: tier 0 = inicial (de graça), tiers 1..3 compráveis ---
export const EQUIPS: Readonly<Record<EquipSlot, EquipDef>> = {
  elmo: {
    nome: 'Elmo',
    tiers: [
      { nome: 'Cabelo ao vento', custo: 0, atk: 0, hp: 0 },
      { nome: 'Capuz de couro', custo: 70, atk: 2, hp: 20 },
      { nome: 'Elmo de ferro', custo: 280, atk: 6, hp: 60 },
      { nome: 'Elmo dourado', custo: 950, atk: 15, hp: 150 },
    ],
  },
  camisa: {
    nome: 'Camisa',
    tiers: [
      { nome: 'Peito nu', custo: 0, atk: 0, hp: 0 },
      { nome: 'Camisa de pano', custo: 60, atk: 0, hp: 30 },
      { nome: 'Tabardo de aço', custo: 250, atk: 4, hp: 90 },
      { nome: 'Armadura dourada', custo: 900, atk: 12, hp: 220 },
    ],
  },
  calcas: {
    nome: 'Calças',
    tiers: [
      { nome: 'Farrapos', custo: 0, atk: 0, hp: 0 },
      { nome: 'Calça de pano', custo: 50, atk: 0, hp: 25 },
      { nome: 'Malha de ferro', custo: 220, atk: 2, hp: 80 },
      { nome: 'Placas douradas', custo: 800, atk: 8, hp: 200 },
    ],
  },
  botas: {
    nome: 'Botas',
    tiers: [
      { nome: 'Pés descalços', custo: 0, atk: 0, hp: 0 },
      { nome: 'Botas de couro', custo: 40, atk: 0, hp: 15 },
      { nome: 'Botas de ferro', custo: 180, atk: 2, hp: 50 },
      { nome: 'Botas velozes', custo: 700, atk: 6, hp: 120 },
    ],
  },
  arma: {
    nome: 'Arma',
    tiers: [
      { nome: 'Graveto', custo: 0, atk: 0, hp: 0 },
      { nome: 'Adaga enferrujada', custo: 60, atk: 4, hp: 0 },
      { nome: 'Espada de ferro', custo: 250, atk: 12, hp: 0 },
      { nome: 'Lâmina rúnica', custo: 900, atk: 30, hp: 0 },
    ],
  },
  escudo: {
    nome: 'Escudo',
    tiers: [
      { nome: 'Sem escudo', custo: 0, atk: 0, hp: 0 },
      { nome: 'Escudo de madeira', custo: 70, atk: 0, hp: 30 },
      { nome: 'Escudo de aço', custo: 300, atk: 5, hp: 100 },
      { nome: 'Escudo dourado', custo: 1000, atk: 12, hp: 240 },
    ],
  },
};

export const ORDEM_SLOTS: readonly EquipSlot[] = [
  'elmo',
  'camisa',
  'calcas',
  'botas',
  'arma',
  'escudo',
];
export const MAX_TIER = 3;
export const TOTAL_SLOTS = ORDEM_SLOTS.length;
export const MAX_PECAS = TOTAL_SLOTS * MAX_TIER; // 18

// --- Skills passivas (níveis 0..5, 100% automáticas) ---
export const SKILLS: Readonly<Record<SkillId, SkillDef>> = {
  afiado: { nome: 'Afiado', desc: '+8% de dano por nível', base: 80 },
  vigor: { nome: 'Vigor', desc: '+10% de vida por nível', base: 80 },
  regen: { nome: 'Regeneração', desc: '+0.6 vida/s por nível', base: 120 },
  rapidez: { nome: 'Rapidez', desc: 'ataca 6% mais rápido/nível', base: 120 },
  saque: { nome: 'Saque', desc: '+12% de ouro por nível', base: 100 },
};
export const ORDEM_SKILLS: readonly SkillId[] = [
  'afiado',
  'vigor',
  'regen',
  'rapidez',
  'saque',
];
export const MAX_SKILL = 5;

/** Multiplicadores das skills (espelham combat.ts — mantidos aqui p/ docs/balance). */
export const SKILL_MULT = {
  afiadoPorNv: 0.08,
  vigorPorNv: 0.1,
  regenPorNv: 0.6,
  rapidezPorNv: 0.06,
  saquePorNv: 0.12,
  intervaloMinimo: 0.4,
} as const;
