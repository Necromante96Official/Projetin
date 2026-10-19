// core/types.ts — tipos canônicos do jogo. Fonte única de verdade para o estado.
// Lógica pura: nenhum acesso a DOM, canvas ou localStorage aqui.

export type EquipSlot = 'elmo' | 'camisa' | 'calcas' | 'botas' | 'arma' | 'escudo';
export type SkillId = 'afiado' | 'vigor' | 'regen' | 'rapidez' | 'saque';
export type BiomaId = 'campo' | 'floresta' | 'caverna' | 'neve' | 'castelo';

export interface EquipTier {
  nome: string;
  custo: number;
  atk: number;
  hp: number;
}

export interface EquipDef {
  nome: string;
  tiers: EquipTier[];
}

export interface SkillDef {
  nome: string;
  desc: string;
  base: number;
}

export interface LugarDef {
  id: string;
  nome: string;
  bioma: BiomaId;
  kinds: number[];
  bossKind: number;
  bossNome: string;
}

export interface RegrasCombate {
  intervaloBase: number;
  intervaloInimigo: number;
  alcancePlayer: number;
  alcanceInimigo: number;
  spawnCd: number;
  velBase: number;
  /** distância (px) do spawn em relação ao cavaleiro */
  distSpawn: number;
  /** cooldown inicial do cavaleiro (s) */
  cdInicialJogador: number;
  /** cooldown inicial do inimigo ao entrar em alcance (s) */
  cdInicialInimigo: number;
}

export interface Cavaleiro {
  nome: string;
  atk: number;
  hp: number;
}

export interface GameState {
  ouro: number;
  lugar: number; // índice absoluto (lugarDe/voltaDe derivam lugar + volta)
  nivel: number; // 1..10 (10 = boss)
  vitorias: number;
  derrotas: number;
  abates: number;
  equip: Record<EquipSlot, number>;
  skills: Record<SkillId, number>;
  cavaleiro: Cavaleiro;
  updatedAt: number;
}

/** Save cru vindo do localStorage: pode conter modelo antigo ou corrompido. */
export type SaveCru = Omit<Partial<GameState>, 'cavaleiro' | 'equip' | 'skills'> & {
  nivelInimigo?: unknown;
  herois?: Array<{ nome?: unknown; atk?: unknown; hp?: unknown }>;
  quartel?: unknown;
  muralha?: unknown;
  mercado?: unknown;
  treinar?: unknown;
  cavaleiro?: Partial<Cavaleiro> | unknown;
  equip?: Partial<Record<EquipSlot, unknown>>;
  skills?: Partial<Record<SkillId, unknown>>;
  [extra: string]: unknown;
};

export interface CombatParams {
  atk: number;
  hp: number;
  /** segundos entre golpes do cavaleiro */
  intervalo: number;
  /** vida/s regenerada */
  regen: number;
  /** multiplicador de ouro (skill saque) */
  ouroMult: number;
}

export interface Inimigo {
  kind: number;
  nome: string;
  hp: number;
  maxHp: number;
  atk: number;
  boss: boolean;
  gold: number;
}

export interface Horda {
  inimigos: Inimigo[];
  total: number;
  bonus: number;
  boss: boolean;
  lugar: string;
  bioma: BiomaId;
}

export interface SimResult {
  venceu: boolean;
  tempo: number;
  abates: number;
  horda: Horda;
}

export interface AvancoNivel {
  subiuLugar: boolean;
  volta: number;
}

export interface GanhoOffline {
  segundosFora: number;
  ouro: number;
}
