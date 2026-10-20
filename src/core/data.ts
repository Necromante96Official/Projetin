// core/data.ts — dados estáticos de balanceamento (sem lógica, sem estado).
// Edite aqui para rebalancear: custos, atributos por tier, skills, lugares, regras.

import type {
  EquipDef,
  EquipSlot,
  ItemTipo,
  ItemTipoDef,
  LugarDef,
  Raridade,
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
      { nome: 'Elmo de ferro', custo: 365, atk: 6, hp: 60 },
      { nome: 'Elmo dourado', custo: 1520, atk: 15, hp: 150 },
    ],
  },
  camisa: {
    nome: 'Camisa',
    tiers: [
      { nome: 'Peito nu', custo: 0, atk: 0, hp: 0 },
      { nome: 'Camisa de pano', custo: 60, atk: 0, hp: 30 },
      { nome: 'Tabardo de aço', custo: 325, atk: 4, hp: 90 },
      { nome: 'Armadura dourada', custo: 1440, atk: 12, hp: 220 },
    ],
  },
  calcas: {
    nome: 'Calças',
    tiers: [
      { nome: 'Farrapos', custo: 0, atk: 0, hp: 0 },
      { nome: 'Calça de pano', custo: 50, atk: 0, hp: 25 },
      { nome: 'Malha de ferro', custo: 285, atk: 2, hp: 80 },
      { nome: 'Placas douradas', custo: 1280, atk: 8, hp: 200 },
    ],
  },
  botas: {
    nome: 'Botas',
    tiers: [
      { nome: 'Pés descalços', custo: 0, atk: 0, hp: 0 },
      { nome: 'Botas de couro', custo: 40, atk: 0, hp: 15 },
      { nome: 'Botas de ferro', custo: 235, atk: 2, hp: 50 },
      { nome: 'Botas velozes', custo: 1120, atk: 6, hp: 120 },
    ],
  },
  arma: {
    nome: 'Arma',
    tiers: [
      { nome: 'Graveto', custo: 0, atk: 0, hp: 0 },
      { nome: 'Adaga enferrujada', custo: 60, atk: 4, hp: 0 },
      { nome: 'Espada de ferro', custo: 325, atk: 12, hp: 0 },
      { nome: 'Lâmina rúnica', custo: 1440, atk: 30, hp: 0 },
    ],
  },
  escudo: {
    nome: 'Escudo',
    tiers: [
      { nome: 'Sem escudo', custo: 0, atk: 0, hp: 0 },
      { nome: 'Escudo de madeira', custo: 70, atk: 0, hp: 30 },
      { nome: 'Escudo de aço', custo: 390, atk: 5, hp: 100 },
      { nome: 'Escudo dourado', custo: 1600, atk: 12, hp: 240 },
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
  afiado: { nome: 'Afiado', desc: '+8% de dano por nível', base: 100 },
  vigor: { nome: 'Vigor', desc: '+10% de vida por nível', base: 100 },
  regen: { nome: 'Regeneração', desc: '+0.6 vida/s por nível', base: 150 },
  rapidez: { nome: 'Rapidez', desc: 'ataca 6% mais rápido/nível', base: 150 },
  saque: { nome: 'Saque', desc: '+12% de ouro por nível', base: 125 },
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

// --- Renascimento (prestígio): troca progresso por brasões permanentes. ---
// Disponível a partir do lugar 1 (depois de vencer o boss do primeiro bioma).
export const PRESTIGIO = {
  lugarMinimo: 1,
  bonusStatsPorBrasao: 0.2,
  bonusOuroPorBrasao: 0.15,
  ouroInicialBase: 30,
  ouroInicialPorBrasao: 50,
  maxBrasoes: 9999,
} as const;

// --- Inventário / drops: itens caem dos monstros e viram ouro ao reciclar. ---
// Chances normais somam 100%; BOSS usa uma tabela melhor (mais raro no topo).
export const RARIDADES: readonly Raridade[] = ['comum', 'incomum', 'raro', 'ultra', 'lendario'];

export const RARIDADE_INFO: Readonly<
  Record<
    Raridade,
    {
      nome: string;
      cor: string;
      valorMult: number;
      pesoNormal: number;
      pesoBoss: number;
      simbolo: string;
    }
  >
> = {
  comum: {
    nome: 'Comum',
    cor: '#b8b2c7',
    valorMult: 1,
    pesoNormal: 50,
    pesoBoss: 15,
    simbolo: '◆',
  },
  incomum: {
    nome: 'Incomum',
    cor: '#63d68a',
    valorMult: 2.4,
    pesoNormal: 29,
    pesoBoss: 30,
    simbolo: '◆◆',
  },
  raro: {
    nome: 'Raro',
    cor: '#74c0fc',
    valorMult: 6,
    pesoNormal: 13,
    pesoBoss: 30,
    simbolo: '★',
  },
  ultra: {
    nome: 'Ultra raro',
    cor: '#b197fc',
    valorMult: 14,
    pesoNormal: 5.5,
    pesoBoss: 18,
    simbolo: '★★',
  },
  lendario: {
    nome: 'Lendário',
    cor: '#f5c542',
    valorMult: 38,
    pesoNormal: 2.5,
    pesoBoss: 7,
    simbolo: '👑',
  },
};

export const ORDEM_TIPOS_ITEM: readonly ItemTipo[] = [
  'moeda',
  'anel',
  'colar',
  'luva',
  'pena',
  'cantil',
  'osso',
  'pedra',
  'broche',
  'cristal',
  'reliquia',
  'gema',
];

export const TIPOS_ITEM: Readonly<Record<ItemTipo, ItemTipoDef>> = {
  moeda: {
    nome: 'Moeda',
    nomes: {
      comum: 'Moeda de cobre',
      incomum: 'Moeda de prata',
      raro: 'Moeda de ouro',
      ultra: 'Moeda do sol',
      lendario: 'Moeda do reino antigo',
    },
    valorMult: 1.2,
    peso: 16,
  },
  anel: {
    nome: 'Anel',
    nomes: {
      comum: 'Anel de cobre',
      incomum: 'Anel de prata',
      raro: 'Anel de rubi',
      ultra: 'Anel do arquimago',
      lendario: 'Anel do rei esquecido',
    },
    valorMult: 1.05,
    peso: 9,
  },
  colar: {
    nome: 'Colar',
    nomes: {
      comum: 'Colar de contas',
      incomum: 'Colar de conchas',
      raro: 'Colar de safiras',
      ultra: 'Colar da lua',
      lendario: 'Colar da rainha',
    },
    valorMult: 1.1,
    peso: 8,
  },
  luva: {
    nome: 'Luva',
    nomes: {
      comum: 'Luva de retalhos',
      incomum: 'Luva de couro',
      raro: 'Luva de malha',
      ultra: 'Luva do duelista',
      lendario: 'Luva do campeão',
    },
    valorMult: 1,
    peso: 10,
  },
  pena: {
    nome: 'Pena',
    nomes: {
      comum: 'Pena de corvo',
      incomum: 'Pena de falcão',
      raro: 'Pena de grifo',
      ultra: 'Pena de fênix',
      lendario: 'Pena celestial',
    },
    valorMult: 0.85,
    peso: 9,
  },
  cantil: {
    nome: 'Cantil',
    nomes: {
      comum: 'Cantil de couro',
      incomum: 'Cantil de latão',
      raro: 'Cantil de prata',
      ultra: 'Cantil do viajante',
      lendario: 'Cantil da fonte eterna',
    },
    valorMult: 0.95,
    peso: 8,
  },
  osso: {
    nome: 'Osso',
    nomes: {
      comum: 'Fragmento de osso',
      incomum: 'Osso de lobo',
      raro: 'Osso de troll',
      ultra: 'Osso de dragão',
      lendario: 'Osso do titã',
    },
    valorMult: 0.9,
    peso: 9,
  },
  pedra: {
    nome: 'Pedra',
    nomes: {
      comum: 'Pedra brilhante',
      incomum: 'Pedra de amolar',
      raro: 'Pedra rúnica',
      ultra: 'Pedra do trovão',
      lendario: 'Pedra do mundo',
    },
    valorMult: 0.8,
    peso: 9,
  },
  broche: {
    nome: 'Broche',
    nomes: {
      comum: 'Broche enferrujado',
      incomum: 'Broche de bronze',
      raro: 'Broche de esmeralda',
      ultra: 'Broche do grão-mestre',
      lendario: 'Broche real',
    },
    valorMult: 1,
    peso: 7,
  },
  cristal: {
    nome: 'Cristal',
    nomes: {
      comum: 'Cristal turvo',
      incomum: 'Cristal azul',
      raro: 'Cristal de gelo',
      ultra: 'Cristal arcano',
      lendario: 'Cristal do infinito',
    },
    valorMult: 1.25,
    peso: 5,
  },
  reliquia: {
    nome: 'Relíquia',
    nomes: {
      comum: 'Relíquia esquecida',
      incomum: 'Relíquia de pedra',
      raro: 'Relíquia sagrada',
      ultra: 'Relíquia do império',
      lendario: 'Relíquia dos deuses',
    },
    valorMult: 1.35,
    peso: 5,
  },
  gema: {
    nome: 'Gema',
    nomes: {
      comum: 'Gema bruta',
      incomum: 'Gema lapidada',
      raro: 'Gema estelar',
      ultra: 'Gema do abismo',
      lendario: 'Gema primordial',
    },
    valorMult: 1.5,
    peso: 5,
  },
};

export const INVENTARIO = {
  slotsIniciais: 50,
  passoSlots: 50,
  slotsMax: 1000,
  custoBase: 600,
  custoFator: 1.55,
  chanceDropBase: 0.4,
  chanceDropPorNivel: 0.015,
  chanceDropMax: 0.6,
  pitySemDrops: 10,
  itensBoss: 3,
  valorBase: 2,
  valorPorNivel: 1.2,
  valorPorLugar: 4.5,
} as const;
