// core/data.ts — dados estáticos de balanceamento (sem lógica, sem estado).
// Edite aqui para rebalancear: custos, atributos por tier, skills, lugares, regras.

import type {
  ConquistaDef,
  ConquistaId,
  EquipDef,
  EquipSlot,
  ItemTipo,
  ItemTipoDef,
  LugarDef,
  MissaoDef,
  MissaoTipo,
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
  'Morcego Sombrio',
  'Aranha Gigante',
  'Golem de Gelo',
  'Espectro',
  'Cavaleiro Caído',
  'Dragão Jovem',
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
    kinds: [2, 3, 5],
    bossKind: 5,
    bossNome: 'Troll Ancião',
  },
  {
    id: 'caverna',
    nome: 'Caverna de Brasas',
    bioma: 'caverna',
    kinds: [6, 7, 3],
    bossKind: 7,
    bossNome: 'Aranha Matriarca',
  },
  {
    id: 'pico',
    nome: 'Pico Nevado',
    bioma: 'neve',
    kinds: [8, 2, 3],
    bossKind: 8,
    bossNome: 'Golem Ancestral',
  },
  {
    id: 'castelo',
    nome: 'Castelo Sombrio',
    bioma: 'castelo',
    kinds: [9, 10, 4],
    bossKind: 10,
    bossNome: 'Rei Caído',
  },
  {
    id: 'ruinas',
    nome: 'Ruínas Douradas',
    bioma: 'ruinas',
    kinds: [4, 10, 0],
    bossKind: 10,
    bossNome: 'Senhor das Ruínas',
  },
  {
    id: 'pantano',
    nome: 'Pântano das Almas',
    bioma: 'pantano',
    kinds: [7, 9, 3],
    bossKind: 9,
    bossNome: 'Ceifador do Pântano',
  },
  {
    id: 'abismo',
    nome: 'Abismo de Obsidiana',
    bioma: 'abismo',
    kinds: [11, 6, 7],
    bossKind: 11,
    bossNome: 'Dragão de Obsidiana',
  },
  {
    id: 'cidadela',
    nome: 'Cidadela Celeste',
    bioma: 'cidadela',
    kinds: [8, 9, 10],
    bossKind: 11,
    bossNome: 'Dragão Ancião',
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

/** Elites: a cada N inimigos, um campeão mais forte (a partir do nível 3). */
export const ELITE = {
  cada: 6,
  nivelMinimo: 3,
  hpMult: 1.45,
  atkMult: 1.18,
  ouroMult: 1.8,
} as const;

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
  fortuna: { nome: 'Fortuna', desc: '+4% de chance de drop por nível', base: 175 },
  tenacidade: { nome: 'Tenacidade', desc: '-4% de dano recebido por nível', base: 175 },
};
export const ORDEM_SKILLS: readonly SkillId[] = [
  'afiado',
  'vigor',
  'regen',
  'rapidez',
  'saque',
  'fortuna',
  'tenacidade',
];
export const MAX_SKILL = 5;

/** Multiplicadores das skills (espelham combat.ts — mantidos aqui p/ docs/balance). */
export const SKILL_MULT = {
  afiadoPorNv: 0.08,
  vigorPorNv: 0.1,
  regenPorNv: 0.6,
  rapidezPorNv: 0.06,
  saquePorNv: 0.12,
  fortunaPorNv: 0.04,
  tenacidadePorNv: 0.04,
  intervaloMinimo: 0.4,
  reducaoDanoMax: 0.8,
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

// --- Conquistas permanentes: metas de longo prazo com recompensa única. ---
export const ORDEM_CONQUISTAS: readonly ConquistaId[] = [
  'primeira-vitoria',
  'cacador',
  'exterminador',
  'primeiro-boss',
  'explorador',
  'conquistador',
  'renascido',
  'dinastia',
  'ferreiro',
  'arsenal',
  'armadura-lendaria',
  'aprendiz',
  'erudito',
  'colecionador',
  'sortudo',
  'cacador-elite',
  'rico',
  'magnata',
  'teimoso',
  'mochila-cheia',
];

export const CONQUISTAS: Readonly<Record<ConquistaId, ConquistaDef>> = {
  'primeira-vitoria': {
    nome: 'Primeira vitória',
    desc: 'Vença sua primeira horda.',
    meta: 1,
    ouro: 60,
    brasoes: 0,
  },
  cacador: {
    nome: 'Caçador',
    desc: 'Derrote 100 inimigos.',
    meta: 100,
    ouro: 200,
    brasoes: 0,
  },
  exterminador: {
    nome: 'Exterminador',
    desc: 'Derrote 1.000 inimigos.',
    meta: 1000,
    ouro: 800,
    brasoes: 0,
  },
  'primeiro-boss': {
    nome: 'Matador de chefes',
    desc: 'Derrote o primeiro BOSS.',
    meta: 1,
    ouro: 250,
    brasoes: 0,
  },
  explorador: {
    nome: 'Além da floresta',
    desc: 'Chegue à Caverna de Brasas.',
    meta: 3,
    ouro: 350,
    brasoes: 0,
  },
  conquistador: {
    nome: 'Conquistador',
    desc: 'Conclua a Cidadela Celeste.',
    meta: 9,
    ouro: 2000,
    brasoes: 1,
  },
  renascido: {
    nome: 'Fênix',
    desc: 'Renasça uma vez.',
    meta: 1,
    ouro: 0,
    brasoes: 1,
  },
  dinastia: {
    nome: 'Dinastia eterna',
    desc: 'Renasça 5 vezes.',
    meta: 5,
    ouro: 0,
    brasoes: 3,
  },
  ferreiro: {
    nome: 'Bem equipado',
    desc: 'Equipe 6 níveis de equipamento.',
    meta: 6,
    ouro: 300,
    brasoes: 0,
  },
  arsenal: {
    nome: 'Arsenal real',
    desc: 'Equipe 12 níveis de equipamento.',
    meta: 12,
    ouro: 900,
    brasoes: 0,
  },
  'armadura-lendaria': {
    nome: 'Armadura lendária',
    desc: 'Equipe 18 níveis de equipamento.',
    meta: 18,
    ouro: 2500,
    brasoes: 1,
  },
  aprendiz: {
    nome: 'Aprendiz',
    desc: 'Aprenda ao menos 1 nível de cada skill.',
    meta: 1,
    ouro: 350,
    brasoes: 0,
  },
  erudito: {
    nome: 'Erudito',
    desc: 'Tenha todas as skills no nível 3.',
    meta: 3,
    ouro: 1500,
    brasoes: 0,
  },
  colecionador: {
    nome: 'Colecionador',
    desc: 'Encontre 50 itens.',
    meta: 50,
    ouro: 350,
    brasoes: 0,
  },
  sortudo: {
    nome: 'Toque de ouro',
    desc: 'Encontre um item lendário.',
    meta: 1,
    ouro: 700,
    brasoes: 0,
  },
  'cacador-elite': {
    nome: 'Caçador de elites',
    desc: 'Derrote 10 inimigos elite.',
    meta: 10,
    ouro: 600,
    brasoes: 0,
  },
  rico: {
    nome: 'Bolsos fundos',
    desc: 'Acumule 10.000 de ouro.',
    meta: 10000,
    ouro: 500,
    brasoes: 0,
  },
  magnata: {
    nome: 'Magnata',
    desc: 'Acumule 1.000.000 de ouro.',
    meta: 1000000,
    ouro: 6000,
    brasoes: 2,
  },
  teimoso: {
    nome: 'Pedra no sapato',
    desc: 'Sofra 10 derrotas.',
    meta: 10,
    ouro: 150,
    brasoes: 0,
  },
  'mochila-cheia': {
    nome: 'Mochila pronta',
    desc: 'Tenha 10 itens guardados ao mesmo tempo.',
    meta: 10,
    ouro: 300,
    brasoes: 0,
  },
};

// --- Missões diárias: 3 metas sorteadas por dia, com bônus por completar todas. ---
export const ORDEM_MISSOES: readonly MissaoTipo[] = [
  'abates',
  'vitorias',
  'elites',
  'bosses',
  'drops',
  'raros',
  'compras',
  'vendas',
  'ouro',
];

export const MISSOES: Readonly<Record<MissaoTipo, MissaoDef>> = {
  abates: {
    nome: 'Caçada diária',
    desc: 'Derrote 40 inimigos.',
    meta: 40,
    ouro: 120,
  },
  vitorias: {
    nome: 'Limpeza de hordas',
    desc: 'Vença 8 hordas.',
    meta: 8,
    ouro: 180,
  },
  elites: {
    nome: 'Elites do dia',
    desc: 'Derrote 4 inimigos elite.',
    meta: 4,
    ouro: 220,
  },
  bosses: {
    nome: 'Chefe do dia',
    desc: 'Derrote 1 BOSS.',
    meta: 1,
    ouro: 200,
  },
  drops: {
    nome: 'Coleta',
    desc: 'Encontre 6 itens.',
    meta: 6,
    ouro: 160,
  },
  raros: {
    nome: 'Tesouro raro',
    desc: 'Encontre 2 itens raros ou melhores.',
    meta: 2,
    ouro: 280,
  },
  compras: {
    nome: 'Investimento',
    desc: 'Compre 6 melhorias.',
    meta: 6,
    ouro: 150,
  },
  vendas: {
    nome: 'Mercador',
    desc: 'Venda 8 itens.',
    meta: 8,
    ouro: 140,
  },
  ouro: {
    nome: 'Fluxo de caixa',
    desc: 'Ganhe 2.500 de ouro.',
    meta: 2500,
    ouro: 240,
  },
};

export const MISSOES_BONUS = {
  ouro: 300,
  brasoes: 1,
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
  'escama',
  'mapa',
  'grimorio',
  'trofeu',
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
    peso: 12,
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
    peso: 7,
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
    peso: 6,
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
    peso: 8,
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
    peso: 7,
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
    peso: 6,
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
    peso: 7,
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
    peso: 7,
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
    peso: 6,
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
    peso: 4,
  },
  escama: {
    nome: 'Escama',
    nomes: {
      comum: 'Escama rachada',
      incomum: 'Escama de serpente',
      raro: 'Escama de dragão',
      ultra: 'Escama do leviatã',
      lendario: 'Escama celestial',
    },
    valorMult: 1.15,
    peso: 5,
  },
  mapa: {
    nome: 'Mapa',
    nomes: {
      comum: 'Mapa rasgado',
      incomum: 'Mapa do viajante',
      raro: 'Mapa do reino',
      ultra: 'Mapa do arquimago',
      lendario: 'Mapa do mundo',
    },
    valorMult: 0.9,
    peso: 5,
  },
  grimorio: {
    nome: 'Grimório',
    nomes: {
      comum: 'Grimório mofado',
      incomum: 'Grimório arcano',
      raro: 'Grimório proibido',
      ultra: 'Grimório do arquimago',
      lendario: 'Grimório dos deuses',
    },
    valorMult: 1.3,
    peso: 5,
  },
  trofeu: {
    nome: 'Troféu',
    nomes: {
      comum: 'Troféu de madeira',
      incomum: 'Troféu de bronze',
      raro: 'Troféu de prata',
      ultra: 'Troféu do campeão',
      lendario: 'Troféu do reino',
    },
    valorMult: 1.4,
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
  chanceDropMax: 0.8,
  pitySemDrops: 10,
  itensBoss: 3,
  valorBase: 2,
  valorPorNivel: 1.2,
  valorPorLugar: 4.5,
} as const;
